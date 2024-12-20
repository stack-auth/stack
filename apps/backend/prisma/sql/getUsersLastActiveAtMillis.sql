SELECT data->>'userId' as "userId", MAX("createdAt") as "lastActiveAt"
FROM "Event"
WHERE data->>'userId' = ANY($1)
GROUP BY data->>'userId'