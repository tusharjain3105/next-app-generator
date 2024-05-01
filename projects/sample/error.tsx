const ErrorPage = ({ error, reset }: { error: Error; reset: Function }) => {
  return (
    <div className="bg-red-50 dark:bg-red-900 text-red-500 absolute inset-0 grid place-items-center">
      <div>{error.message}</div>
      <button
        className="rounded px-3 py-2 bg-red-500 hover:opacity-20"
        onClick={reset.bind(this)}
      >
        Reset
      </button>
    </div>
  );
};
export default ErrorPage;
