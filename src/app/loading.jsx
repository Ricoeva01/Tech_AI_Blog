export default function loading() {
  return (
    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
      <span className="animate-spin block w-14 h-14 mb-14 border-4 border-gray-300 rounded-full border-t-indigo-500"></span>
    </div>
  );
}
