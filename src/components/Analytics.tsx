"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import * as ackeeTracker from "ackee-tracker";

function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeRecord = useRef<{ stop: () => void } | null>(null);
  const trackerInstance = useRef<ackeeTracker.TrackerInstance | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchConfigAndInit = async () => {
      try {
        const res = await fetch("/api/analytics-config");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        
        if (!isMounted) return;

        const server = data.server;
        const domainId = data.domainId;

        console.log("Ackee Tracker Init Info (Runtime):", { server, domainId });

        if (!server || !domainId) {
          console.warn("Ackee Tracker: Missing server URL or Domain ID environment variables.");
          return;
        }

        if (!trackerInstance.current) {
          console.log("Ackee Tracker: Creating instance for", server);
          trackerInstance.current = ackeeTracker.create(server, {
            detailed: true,
            ignoreLocalhost: false,
          });
        }

        if (activeRecord.current) {
          activeRecord.current.stop();
        }

        const location =
          window.location.origin +
          pathname +
          (searchParams.toString() ? `?${searchParams.toString()}` : "");

        console.log("Ackee Tracker: Recording page view", location);
        activeRecord.current = trackerInstance.current.record(domainId, {
          ...ackeeTracker.attributes(true),
          siteLocation: location,
        });
      } catch (err) {
        console.error("Ackee Tracker: Failed to fetch configuration", err);
      }
    };

    fetchConfigAndInit();

    return () => {
      isMounted = false;
      if (activeRecord.current) {
        activeRecord.current.stop();
        activeRecord.current = null;
      }
    };
  }, [pathname, searchParams]);

  return null;
}

export default function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTracker />
    </Suspense>
  );
}
