"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { claimGuestBookings } from "@/app/account/actions";

/** Runs once on mount to attach guest bookings matching auth email. */
export function ClaimGuestBookingsOnMount() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void claimGuestBookings().then((res) => {
      if (res.ok && (res.claimed ?? 0) > 0) {
        router.refresh();
      }
    });
  }, [router]);

  return null;
}
