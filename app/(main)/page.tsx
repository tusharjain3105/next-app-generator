import { redirect } from "next/navigation";

const HomePage = () => {
  redirect("/create-app");
  return <main className="h-full"></main>;
};
export default HomePage;
