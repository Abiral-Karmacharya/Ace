import axios from "axios";

const PRIMARY = import.meta.env.VITE_API_LINK;
console.log(PRIMARY)

const client = axios.create({
  baseURL: PRIMARY,
  withCredentials: true,
  timeout: 8000,
});

let usingSecondary = false;

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (
      !usingSecondary &&
      (error.code === "ECONNREFUSED" ||
        error.code === "ERR_NETWORK" ||
        error.code === "ECONNABORTED") &&
      !config._retried
    ) {
      usingSecondary = true;
      config._retried = true;
      return client(config);
    }
    return Promise.reject(error);
  },
);

export default client;
