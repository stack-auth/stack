const PLACEHOLDER_DATA = [
  { date: "Dec 01", activity: 186, },
  { date: "Dec 02", activity: 205, },
  { date: "Dec 03", activity: 237, },
  { date: "Dec 04", activity: 303, },
  { date: "Dec 05", activity: 309, },
  { date: "Dec 06", activity: 314, },
  { date: "Dec 07", activity: 314, },
  { date: "Dec 08", activity: 314, },
  { date: "Dec 09", activity: 314, },
  { date: "Dec 10", activity: 186, },
  { date: "Dec 11", activity: 186, },
  { date: "Dec 12", activity: 205, },
  { date: "Dec 13", activity: 237, },
  { date: "Dec 14", activity: 303, },
  { date: "Dec 15", activity: 309, },
  { date: "Dec 16", activity: 314, },
  { date: "Dec 17", activity: 314, },
  { date: "Dec 18", activity: 314, },
  { date: "Dec 19", activity: 314, },
  { date: "Dec 20", activity: 186, },
  { date: "Dec 21", activity: 186, },
  { date: "Dec 22", activity: 205, },
  { date: "Dec 23", activity: 237, },
  { date: "Dec 24", activity: 303, },
  { date: "Dec 25", activity: 309, },
  { date: "Dec 26", activity: 314, },
  { date: "Dec 27", activity: 314, },
  { date: "Dec 28", activity: 314, },
  { date: "Dec 29", activity: 314, },
];

export async function GET(request: Request) {
  return Response.json({
    totalUsers: PLACEHOLDER_DATA,
    dailyActiveUsers: PLACEHOLDER_DATA,
  });
}
