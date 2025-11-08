#!/usr/bin/env node

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

// Configuration
const RATE_LIMIT_DELAY_SECONDS = 5; // Delay between requests to avoid rate limits

// Helper function to delay execution
function delay(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

// Define the schema for job posting data
const jobPostingSchema = z.object({
  company: z.string().describe("The name of the company posting the job"),
  jobTitle: z
    .string()
    .describe("The job title (e.g., SWE I, MLE, Senior Backend Engineer)"),
  location: z
    .string()
    .nullable()
    .describe(
      "The job location (e.g., 'San Francisco, CA', 'Remote', 'New York, NY'). Return null if not specified."
    ),
  skills: z
    .array(z.string())
    .describe(
      "Required programming languages, libraries, tools, and domain-specific knowledge"
    ),
  responsibilities: z
    .array(z.string())
    .describe("Single-sentence summaries of key job responsibilities"),
  qualifications: z
    .array(z.string())
    .describe(
      "Required qualifications including education (e.g., Bachelor's/Master's degree), certifications, publications, and other formal requirements"
    ),
  yearlyPay: z
    .number()
    .nullable()
    .describe(
      "The yearly salary/compensation in dollars as a number. Return null if not specified."
    ),
  benefits: z
    .array(z.string())
    .describe(
      "Benefits offered including stock options, health insurance, lodging, 401k, PTO, etc."
    ),
  postingDate: z
    .string()
    .nullable()
    .describe(
      "The date the job was posted in JavaScript Date string format (e.g., '2025-01-15'). Return null if not specified."
    ),
  fetchDate: z
    .string()
    .describe("The date and time when this job data was fetched"),
  postSource: z.string().describe("The URL of the job posting"),
});

async function extractJobData(url) {
  // Get API key from environment variable
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY environment variable not set");
    process.exit(1);
  }

  // Initialize Gemini AI
  const ai = new GoogleGenAI({ apiKey });

  // Configure grounding tool for web search
  const groundingTool = {
    googleSearch: {},
  };

  const config = {
    tools: [groundingTool],
    // Note: Cannot use responseMimeType with tools, so we rely on prompt instructions
  };

  try {
    // Step 1: Extract job information with grounding
    console.error("Fetching job posting data...");
    const extractionResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Search the web and find the job posting at this URL: ${url}

Extract and describe the following information from the job posting in detail:
- Company name
- Job title (the specific role title)
- Location (city and state, or "Remote", or "Hybrid")
- All required skills and experiences (programming languages, frameworks, libraries, tools, domain knowledge)
- All key responsibilities
- All qualifications (education, certifications, publications, etc.)
- Yearly salary/compensation if mentioned
- Benefits offered if mentioned
- Posting date if available

Provide a comprehensive extraction of all the information you find.`,
      config,
    });

    const extractedInfo = extractionResponse.text;
    console.error("Extracted information:", extractedInfo);
    console.error("---");

    // Step 2: Convert to structured JSON (without grounding tool)
    console.error("Converting to structured JSON...");
    const structuredResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Convert the following job posting information into a valid JSON object with this exact structure:

{
  "company": "string - company name",
  "jobTitle": "string - job title",
  "location": "string or null - location",
  "skills": ["array of strings - each skill/technology"],
  "responsibilities": ["array of strings - each responsibility as a single sentence"],
  "qualifications": ["array of strings - each qualification"],
  "yearlyPay": number or null - yearly salary as a number (e.g., 120000),
  "benefits": ["array of strings - each benefit"],
  "postingDate": "string or null - ISO date format YYYY-MM-DD",
  "source_url": "${url}"
}

CRITICAL: Return ONLY valid JSON. Do not include:
- Any explanatory text or comments
- Markdown code blocks
- Any text outside the JSON object
- Any invalid JSON syntax (ensure all strings are properly quoted, arrays are properly formatted, no trailing text)

Job posting information:
${extractedInfo}`,
      config: {}, // No tools for structured conversion
    });

    // Parse and validate the response
    let responseText = structuredResponse.text;

    // Debug: print raw response
    console.error("Raw structured response:", responseText);
    console.error("---");

    // Remove markdown code blocks if present
    if (responseText.includes("```")) {
      responseText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
    }

    // Extract first JSON object only (handle duplicates)
    const jsonStart = responseText.indexOf("{");
    const jsonEnd = responseText.indexOf("\n{", jsonStart); // Find start of duplicate

    let jsonText;
    if (jsonEnd !== -1) {
      // Extract only the first JSON object
      jsonText = responseText.substring(jsonStart, jsonEnd).trim();
    } else {
      // No duplicate, extract from start to end
      const lastBrace = responseText.lastIndexOf("}");
      jsonText = responseText.substring(jsonStart, lastBrace + 1).trim();
    }

    let rawData;
    try {
      rawData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      console.error("Attempting to clean and retry...");

      // Try to fix common JSON issues
      let cleanedJson = jsonText
        // Remove any text after quotes that shouldn't be there
        .replace(/"([^"]*)"[^,\]\}]/g, '"$1",')
        // Fix trailing commas before closing brackets
        .replace(/,(\s*[\]\}])/g, '$1');

      try {
        rawData = JSON.parse(cleanedJson);
        console.error("Successfully parsed after cleaning");
      } catch (retryError) {
        console.error("Failed to parse even after cleaning:", retryError.message);
        throw new Error(`Invalid JSON from API: ${parseError.message}`);
      }
    }

    // Map field names (handle both snake_case and camelCase)
    const jobData = jobPostingSchema.parse({
      company: rawData.company || rawData.company_name,
      jobTitle: rawData.jobTitle || rawData.job_title,
      location: rawData.location || null,
      skills:
        rawData.skills ||
        rawData.skills_and_experiences ||
        rawData.skills_and_experiences_required ||
        [],
      responsibilities:
        rawData.responsibilities || rawData.key_responsibilities || [],
      qualifications:
        rawData.qualifications || rawData.required_qualifications || [],
      yearlyPay:
        rawData.yearlyPay || rawData.yearly_pay || rawData.salary || null,
      benefits: rawData.benefits || [],
      postingDate: rawData.postingDate || rawData.posting_date || null,
      fetchDate: new Date().toISOString(),
      postSource: rawData.postSource || rawData.source_url,
    });

    // Output as single-line JSON (JSONL format) for appending to files
    console.log(JSON.stringify(jobData));

    // Delay to avoid rate limits
    await delay(RATE_LIMIT_DELAY_SECONDS);
  } catch (error) {
    console.error("Error extracting job data:", error.message);
    process.exit(1);
  }
}

// Main CLI logic
const url = process.argv[2];

if (!url) {
  console.error("Usage: rolescope <job-posting-url>");
  console.error(
    'Example: rolescope "https://example.com/jobs/123" >> data.json'
  );
  process.exit(1);
}

// Validate URL format
try {
  new URL(url);
} catch (error) {
  console.error("Error: Invalid URL provided");
  process.exit(1);
}

extractJobData(url);
