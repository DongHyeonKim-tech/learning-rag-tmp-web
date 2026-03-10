import axios from "axios";
// import jwt_decode from "jwt-decode";

export const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});
