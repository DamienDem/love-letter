import CreateGameForm from "@/components/CreateGameForm";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center  space-y-8 max-w-[800px]">
      <h1 className="text-2xl font-bold mb-4">
        Créer une nouvelle partie de Love Letter
      </h1>
      <CreateGameForm />
    </div>
  );
}
