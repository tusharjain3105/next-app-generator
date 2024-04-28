"use client";
const ErrorPage = ({ error }: { error: Error }) => {
  return (
    <div className="p-5 text-lg text-red-400 bg-red-50">{error.message}</div>
  );
};
export default ErrorPage;
