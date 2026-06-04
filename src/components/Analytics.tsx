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
    const server = process.env.NEXT_PUBLIC_ACKEE_SERVER;
    const domainId = process.env.NEXT_PUBLIC_ACKEE_DOMAIN_ID;

    if (!server || !domainId) return;

    if (!trackerInstance.current) {
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

    activeRecord.current = trackerInstance.current.record(domainId, {
      ...ackeeTracker.attributes(true),
      siteLocation: location,
    });

    return () => {
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
