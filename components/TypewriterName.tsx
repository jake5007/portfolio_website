"use client";

import { useEffect, useState } from "react";
import { startTypewriter } from "@/lib/typewriter";

export default function TypewriterName() {
  const [text, setText] = useState("");

  useEffect(() => startTypewriter(setText), []);

  return <span className="typewriter-name">{text}</span>;
}
