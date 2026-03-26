"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

export default function BottomNav() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    createSupabaseBrowser()
      .auth.getUser()
      .then(({ data }: { data: { user: User | null } }) => setLoggedIn(!!data.user));
  }, []);

  if (!loggedIn) return null;

  const items = [
    { href: "/", label: "홈", icon: "🏠" },
    { href: "/upload", label: "새 사진", icon: "📷" },
    { href: "/dashboard", label: "사진첩", icon: "🖼️" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm safe-bottom">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[64px] flex-col items-center gap-0.5 text-xs transition ${
                active
                  ? "font-bold text-primary"
                  : "text-gray-400 active:text-gray-600"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
