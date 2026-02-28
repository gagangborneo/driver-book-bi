export default function EmployeeMonitoringPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dashboard Monitoring</h1>
      <iframe
        title="LAMIN_BPP"
        width="100%"
        height="800"
        src="https://app.powerbi.com/view?r=eyJrIjoiMDE5MGNiOWItMzI1NS00MTZlLTliN2MtNTZiODcwZjYxMDM0IiwidCI6ImNhMzc0OTJlLWY0MTAtNDI3Yi1hYjM5LTA1NWJkYzE4Y2UwMiIsImMiOjEwfQ%3D%3D"
        frameBorder="0"
        allowFullScreen
        className="w-full rounded-lg border bg-white"
      />
    </div>
  );
}
