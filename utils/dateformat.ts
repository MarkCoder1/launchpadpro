export const formatDate = (dateString?: string) => {
  if (dateString === null) return "Unknown"
  const date = new Date(dateString!);

  const formatted = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
  return formatted
};
