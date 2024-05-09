import { ProjectForm } from "./form";

export default function Page () {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <div className="w-full flex md:w-[640px] gap-4">
        <div className="w-1/2">
          <ProjectForm />
        </div>
      </div>
    </div>
  );
}