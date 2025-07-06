export const ClearSearchFilters = ({
  setFilters,
  setInternships,
  setJobs,
  setScholarships,
  setTotalResults,
}: {
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  setInternships: React.Dispatch<React.SetStateAction<Internship[]>>;
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  setScholarships: React.Dispatch<React.SetStateAction<Scholarship[]>>;
  setTotalResults: React.Dispatch<React.SetStateAction<number>>;
}) => {
  setFilters({
    type: "",
    country: "",
    keyword: "",
    postDate: "",
    offset: 0,
    LogicalOperator: "AND",
    isRemote: false
  });
  setInternships([]);
  setJobs([]);
  setScholarships([]);
  setTotalResults(0);
};
