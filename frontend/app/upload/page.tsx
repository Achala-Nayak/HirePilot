"use client";

import { useState } from "react";
import { api } from "@/services/api";

export default function UploadPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [numJobs, setNumJobs] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert("Please upload your resume.");
      return;
    }

    const formData = new FormData();
    formData.append("job_title", jobTitle);
    formData.append("job_location", jobLocation);
    formData.append("years_experience", yearsExperience);
    formData.append("num_jobs", numJobs);
    formData.append("file", file);

    try {

      await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });


      const searchForm = new FormData();
      searchForm.append("job_title", jobTitle);
      searchForm.append("job_location", jobLocation);
      searchForm.append("num_jobs", numJobs);

      const res = await api.post("/api/v1/jobs/search", {
        job_title: jobTitle,
        location: jobLocation,
        job_count: parseInt(numJobs)
      });
      setJobs(res.data.jobs);

    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
    }
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Upload Resume & Search Jobs</h1>
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <input
          type="text"
          placeholder="Job Title"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          className="border p-2 w-full"
        />
        <input
          type="text"
          placeholder="Job Location"
          value={jobLocation}
          onChange={(e) => setJobLocation(e.target.value)}
          className="border p-2 w-full"
        />
        <input
          type="number"
          placeholder="Years of Experience"
          value={yearsExperience}
          onChange={(e) => setYearsExperience(e.target.value)}
          className="border p-2 w-full"
        />
        <input
          type="number"
          placeholder="Number of Jobs"
          value={numJobs}
          onChange={(e) => setNumJobs(e.target.value)}
          className="border p-2 w-full"
        />
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="border p-2 w-full"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Submit & Search Jobs
        </button>
      </form>


      {jobs.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Job Results</h2>
          <ul className="space-y-2">
            {jobs.map((job, index) => (
              <li key={index} className="border p-3 rounded">
                <h3 className="font-bold">{job.title}</h3>
                <p>{job.company} — {job.location}</p>
                <a
                  href={job.link}
                  target="_blank"
                  className="text-blue-500 underline"
                >
                  View Job
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
