# RoleScope

Extract structured job posting data from URLs using the Gemini API.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set your Gemini API key as an environment variable:

```bash
export GEMINI_API_KEY="your-api-key-here"
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
  "location": "San Francisco, CA",
  "skills": [
    "Python",
    "JavaScript",
    "React",
    "Node.js",
    "SQL",
    "Docker",
    "AWS"
  ],
  "responsibilities": [
    "Design and implement new features for the platform",
    "Collaborate with cross-functional teams to deliver high-quality products",
    "Write clean, maintainable, and well-tested code"
  ],
  "qualifications": [
    "Bachelor's degree in Computer Science or related field",
    "3+ years of professional software development experience",
    "Strong understanding of web technologies and best practices"
  ],
  "yearlyPay": 150000,
  "benefits": [
    "Health insurance",
    "401k matching",
    "Stock options",
    "Unlimited PTO",
    "Remote work options"
  ],
  "postingDate": "2025-01-15",
  "fetchDate": "2025-01-20T10:30:45.123Z",
  "postSource": "https://example.com/job-posting-url"
}
```

## Field Descriptions

- **company** (string): Name of the company posting the job
- **jobTitle** (string): Specific job title (e.g., "SWE I", "MLE", "Senior Backend Engineer")
- **location** (string | null): Job location (city, state, "Remote", "Hybrid", etc.) or null if not specified
- **skills** (array of strings): Required programming languages, frameworks, libraries, tools, and domain-specific knowledge
- **responsibilities** (array of strings): Single-sentence summaries of key job responsibilities
- **qualifications** (array of strings): Required qualifications including education, certifications, publications, and other formal requirements
- **yearlyPay** (number | null): Annual salary/compensation in dollars, or null if not specified
- **benefits** (array of strings): Benefits offered (stock options, health insurance, 401k, PTO, etc.)
- **postingDate** (string | null): Date the job was posted in ISO format (YYYY-MM-DD), or null if not specified
- **fetchDate** (string): ISO 8601 timestamp of when this data was fetched
- **postSource** (string): The URL of the job posting

## Requirements

- Node.js 18+
- Gemini API key (get one at https://ai.google.dev/)

## Configuration

The script includes a configurable rate limit delay to prevent API throttling. You can adjust this in [index.js:7](index.js#L7):

```javascript
const RATE_LIMIT_DELAY_SECONDS = 5; // Delay between requests
```

## Notes

- The script uses a two-step process:
  1. Gemini 2.5 Flash with Google Search grounding extracts job information
  2. A second API call converts the extracted information to structured JSON
- Rate limiting: 5-second delay after each successful extraction (configurable)
- Error messages and debug info are written to stderr, so they won't interfere with piped JSON output
