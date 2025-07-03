export const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
