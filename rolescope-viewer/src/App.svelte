<script lang="ts">
  import jobsData from "./assets/jobs.jsonl?raw";

  interface Job {
    company: string;
    jobTitle: string;
    location: string | null;
    skills: string[];
    responsibilities: string[];
    qualifications: string[];
    yearlyPay: number | null;
    benefits: string[];
    postingDate: string | null;
    fetchDate: string | null;
    postSource: string;
  }

  const jobs: Job[] = jobsData
    .trim()
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
</script>

<div class="p-4">
  <table class="w-full border-collapse border border-black">
    <thead>
      <tr class="bg-gray-100">
        <th class="border border-black px-2 py-1 text-left">Company</th>
        <th class="border border-black px-2 py-1 text-left">Job Title</th>
        <th class="border border-black px-2 py-1 text-left">Location</th>
        <th class="border border-black px-2 py-1 text-left">Skills</th>
        <th class="border border-black px-2 py-1 text-left">Responsibilities</th
        >
        <th class="border border-black px-2 py-1 text-left">Qualifications</th>
        <th class="border border-black px-2 py-1 text-left">Yearly Pay</th>
        <th class="border border-black px-2 py-1 text-left">Benefits</th>
        <th class="border border-black px-2 py-1 text-left">Source</th>
        <th class="border border-black px-2 py-1 text-left">Post Date</th>
        <th class="border border-black px-2 py-1 text-left">Fetch Date</th>
      </tr>
    </thead>
    <tbody>
      {#each jobs as job, i (i)}
        <tr>
          <td class="border border-black px-2 py-1">{job.company}</td>
          <td class="border border-black px-2 py-1">{job.jobTitle}</td>
          <td class="border border-black px-2 py-1">
            {job.location ?? "N/A"}
          </td>
          <td class="border border-black px-2 py-1">
            <ul class="list-disc list-inside">
              {#each job.skills as skill, j (j)}
                <li class="text-sm">{skill}</li>
              {/each}
            </ul>
          </td>
          <td class="border border-black px-2 py-1">
            <ul class="list-disc list-inside">
              {#each job.responsibilities as responsibility, k (k)}
                <li class="text-sm">{responsibility}</li>
              {/each}
            </ul>
          </td>
          <td class="border border-black px-2 py-1">
            <ul class="list-disc list-inside">
              {#each job.qualifications as qualification, l (l)}
                <li class="text-sm">{qualification}</li>
              {/each}
            </ul>
          </td>
          <td class="border border-black px-2 py-1">
            {job.yearlyPay !== null
              ? `$${job.yearlyPay?.toLocaleString() ?? ""}`
              : "N/A"}
          </td>
          <td class="border border-black px-2 py-1">
            <ul class="list-disc list-inside">
              {#each job.benefits as benefit, m (m)}
                <li class="text-sm">{benefit}</li>
              {/each}
            </ul>
          </td>
          <td class="border border-black px-2 py-1">
            <a
              href={job.postSource}
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 hover:underline text-sm"
            >
              View
            </a>
          </td>
          <td class="border border-black px-2 py-1">
            {job.postingDate ?? "Null"}
          </td>
          <td class="border border-black px-2 py-1">
            {job.fetchDate ?? "Null"}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
