/* eslint-disable no-undef */
const cache = new Map(); // replace with Redis in production

export default async function handler(req, res) {
  try {
    const { skills = [], title = "", location = "remote", page = 1 } = req.body;

    const cacheKey = JSON.stringify({ skills, title, location, page });

    if (cache.has(cacheKey)) {
      return res.status(200).json(cache.get(cacheKey));
    }

    const query = encodeURIComponent(`${title || skills.join(" ")} developer`);

    const url = `https://jsearch.p.rapidapi.com/search?query=${query}&page=${page}&num_pages=1&country=us`;

    const response = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
      },
    });

    const data = await response.json();
    console.log("data", data);

    let jobs = (data?.data || []).map(normalizeJob);

    // jobs = jobs
    //   .map((job) => ({
    //     ...job,
    //     matchScore: scoreJob(job, { skills, title, location }),
    //   }))
    //   .filter((j) => j.matchScore >= 40)
    //   .sort((a, b) => b.matchScore - a.matchScore);

    const result = {
      page,
      total: jobs.length,
      jobs: jobs.slice(0, 10),
    };

    cache.set(cacheKey, result);

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function normalizeJob(job) {
  return {
    id: job.job_id,
    title: job.job_title,
    company: job.employer_name,
    location: job.job_city || job.job_country,
    description: job.job_description || "",
    isRemote: job.job_is_remote,
    applyLink: job.job_apply_link,
    posted: job.job_posted_at_datetime_utc,
  };
}

function scoreJob(job, profile) {
  let score = 0;

  const text = (job.title + " " + job.description).toLowerCase();

  // skill match
  profile.skills.forEach((skill) => {
    if (text.includes(skill.toLowerCase())) {
      score += 15;
    }
  });

  // title match
  if (profile.title && text.includes(profile.title.toLowerCase())) {
    score += 20;
  }

  // remote preference
  if (job.isRemote && profile.location === "remote") {
    score += 10;
  }

  return Math.min(score, 100);
}
