#!/usr/bin/env node

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Define the schema for job posting data
const jobPostingSchema = z.object({
  company: z.string().describe("The name of the company posting the job"),
  jobTitle: z.string().describe("The job title (e.g., SWE I, MLE, Senior Backend Engineer)"),
  skills: z.array(z.string()).describe("Required programming languages, libraries, tools, and domain-specific knowledge"),
  responsibilities: z.array(z.string()).describe("Single-sentence summaries of key job responsibilities"),
  postingDate: z.string().nullable().describe("The date the job was posted in JavaScript Date string format (e.g., '2025-01-15'). Return null if not specified."),
  postSource: z.string().describe("The URL of the job posting")
});

async function extractJobData(url) {
  // Get API key from environment variable
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY environment variable not set');
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
    responseMimeType: "application/json",
    responseJsonSchema: zodToJsonSchema(jobPostingSchema, "jobPosting")
  };

  try {
    // Generate content with grounding
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Search the web and find the job posting at this URL: ${url}

Extract the following information from the job posting:
- Company name
- Job title (the specific role title like "SWE I", "Machine Learning Engineer", "Senior Backend Engineer", etc.)
- Skills and experiences required (programming languages, frameworks, libraries, tools, domain knowledge)
- Key responsibilities (provide single-sentence summaries)
- Posting date (if available, convert to ISO date string format like "2025-01-15")
- The source URL (which is: ${url})

Make sure to thoroughly search for and extract all relevant technical skills, tools, and requirements mentioned in the posting.`,
      config,
    });

    // Parse and validate the response
    let responseText = response.text;

    // Debug: print raw response
    console.error('Raw API response:', responseText);
    console.error('---');

    // Remove markdown code blocks if present
    if (responseText.includes('```')) {
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    // Extract first JSON object only (handle duplicates)
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.indexOf('\n{', jsonStart); // Find start of duplicate

    let jsonText;
    if (jsonEnd !== -1) {
      // Extract only the first JSON object
      jsonText = responseText.substring(jsonStart, jsonEnd).trim();
    } else {
      // No duplicate, extract from start to end
      const lastBrace = responseText.lastIndexOf('}');
      jsonText = responseText.substring(jsonStart, lastBrace + 1).trim();
    }

    const rawData = JSON.parse(jsonText);

    // Map field names (handle both snake_case and camelCase)
    const jobData = jobPostingSchema.parse({
      company: rawData.company || rawData.company_name,
      jobTitle: rawData.jobTitle || rawData.job_title,
      skills: rawData.skills || rawData.skills_and_experiences,
      responsibilities: rawData.responsibilities || rawData.key_responsibilities,
      postingDate: rawData.postingDate || rawData.posting_date,
      postSource: rawData.postSource || rawData.source_url
    });

    // Output as single-line JSON (JSONL format) for appending to files
    console.log(JSON.stringify(jobData));

  } catch (error) {
    console.error('Error extracting job data:', error.message);
    process.exit(1);
  }
}

// Main CLI logic
const url = process.argv[2];

if (!url) {
  console.error('Usage: rolescope <job-posting-url>');
  console.error('Example: rolescope "https://example.com/jobs/123" >> data.json');
  process.exit(1);
}

// Validate URL format
try {
  new URL(url);
} catch (error) {
  console.error('Error: Invalid URL provided');
  process.exit(1);
}

extractJobData(url);
