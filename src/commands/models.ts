import LogUtils from "../utils/log";

const response = await fetch("https://api.theb.ai/v1/models", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
});

LogUtils.log(JSON.stringify(await response.json()));
