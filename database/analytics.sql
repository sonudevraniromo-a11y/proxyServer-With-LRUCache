SELECT COUNT(*) AS total_requests FROM request_logs;
SELECT SUM(CASE WHEN cache_hit = TRUE THEN 1 ELSE 0 END) AS cache_hits, SUM(CASE WHEN cache_hit = FALSE THEN 1 ELSE 0 END) AS cache_misses FROM request_logs;
SELECT COALESCE(AVG(response_time_ms), 0) AS average_response_time_ms FROM request_logs;
SELECT thread_id, COUNT(*) AS requests_handled FROM request_logs GROUP BY thread_id ORDER BY requests_handled DESC;
SELECT cache_hit, AVG(response_time_ms) AS average_response_time_ms FROM request_logs GROUP BY cache_hit;
SELECT DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS minute, COUNT(*) AS requests FROM request_logs GROUP BY minute ORDER BY minute;
