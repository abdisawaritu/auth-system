import { Link } from "react-router-dom";
import PagePlaceholder from "../../components/common/PagePlaceholder";

function NotFound() {
  return (
    <PagePlaceholder
      title="404 — Page Not Found"
      description="The page you requested does not exist."
    >
      <Link to="/">Return Home</Link>
    </PagePlaceholder>
  );
}

export default NotFound;
