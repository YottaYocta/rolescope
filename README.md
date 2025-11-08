# RoleScope

Extract structured job posting data from URLs using the Gemini API.

## Features

- Extracts structured job data including company, title, skills, responsibilities, and posting date
- Uses Gemini Flash with Google Search grounding for accurate data extraction
- Outputs single-line JSON (JSONL format) for easy appending to files
- Simple CLI interface

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set your Gemini API key as an environment variable:
```bash
export GEMINI_API_KEY="your-api-key-here"
```

3. (Optional) Install globally to use the `rolescope` command anywhere:
```bash
npm link
```

## Usage

Basic usage:
```bash
node index.js "https://example.com/job-posting-url"
```

If installed globally:
```bash
rolescope "https://example.com/job-posting-url"
```

Append to a JSONL file:
```bash
rolescope "https://example.com/job-posting-url" >> data.jsonl
```

Multiple job postings:
```bash
rolescope "https://example.com/job1" >> data.jsonl
rolescope "https://example.com/job2" >> data.jsonl
rolescope "https://example.com/job3" >> data.jsonl
```

## Output Format

The script outputs a single-line JSON object with the following fields:

```json
{
  "company": "Company Name",
  "jobTitle": "Software Engineer I",
  "skills": ["Python", "JavaScript", "React", "Node.js", "SQL"],
  "responsibilities": ["Design and implement new features", "Collaborate with cross-functional teams", "Write clean, maintainable code"],
  "postingDate": "2025-01-15",
  "postSource": "https://example.com/job-posting-url"
}
```

## Field Descriptions

- **company**: Name of the company posting the job
- **jobTitle**: Specific job title (e.g., "SWE I", "MLE", "Senior Backend Engineer")
- **skills**: Array of required programming languages, libraries, tools, and domain-specific knowledge
- **responsibilities**: Array of single-sentence summaries of key job responsibilities
- **postingDate**: Date the job was posted in ISO format (YYYY-MM-DD), or null if not specified
- **postSource**: The URL of the job posting

## Requirements

- Node.js 18+
- Gemini API key (get one at https://ai.google.dev/)

## Notes

- The script uses Gemini 2.0 Flash with Google Search grounding to find and extract data from job postings
- Error messages are written to stderr, so they won't interfere with piped JSON output
- The script validates that a proper URL is provided before making API calls
