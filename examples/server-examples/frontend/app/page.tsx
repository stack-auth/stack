'use client';

import { useState } from "react";


function ExampleBlock() {
  
}

export default function Home() {
  const [flaskResult, setFlaskResult] = useState(null);
  return <div>
    <button onClick={() => alert('Hello, world!')}>Authenticate with python backend</button>
    Python backend result: 
  </div>
}
