import { Driver } from '../types/location';
interface LiveDriverMapProps {
  drivers: Driver[];
  onDriverClick: (driver: Driver) => void;
}

export function LiveDriverMap({ drivers, onDriverClick }: LiveDriverMapProps) {
  return (
    <div className="w-full h-full relative rounded-lg border border-border bg-card p-4">
      <div className="text-sm font-semibold text-foreground">
        Live map disabled (map library not available in build environment).
      </div>
      <div className="mt-2 space-y-3 text-sm text-muted-foreground">
        {drivers.length === 0 ? (
          <div>No driver locations available.</div>
        ) : (
          <ul className="space-y-2">
            {drivers.map((driver) => {
              const latestLocation = driver.locations[driver.locations.length - 1];
              const locationText = latestLocation
                ? `${latestLocation.latitude.toFixed(5)}, ${latestLocation.longitude.toFixed(5)}`
                : 'Location unavailable';

              return (
                <li
                  key={driver.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background/50 px-3 py-2"
                >
                  <button
                    type="button"
                    className="text-left text-foreground hover:underline"
                    onClick={() => onDriverClick(driver)}
                  >
                    {driver.full_name}
                  </button>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {driver.status}
                  </div>
                  <div className="text-xs text-muted-foreground">{locationText}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
