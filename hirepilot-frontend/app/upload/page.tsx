"use client";

import { useState } from "react";
import axios from "axios";

export default function UploadPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [numJobs, setNumJobs] = useState("");
  const [file, setFile] = useState<File | null>(null);

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
      const res = await axios.post("http://localhost:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log(res.data);
      alert("Upload successful!");
    } catch (error) {
      console.error(error);
      alert("Upload failed!");
    }
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Upload Resume</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          Submit
        </button>
      </form>
    </main>
  );
}
