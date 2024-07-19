/* eslint-disable @typescript-eslint/no-misused-promises */
import { useState } from "react";
import { useUser } from "your-user-hook-path"; // Replace with your actual path
import { updateUserDisplayName } from "your-api-path"; // Replace with your actual API call

const UserProfile = () => {
  const { user, refetchUser } = useUser(); // Assuming refetchUser is a method to re-fetch user data
  const [displayName, setDisplayName] = useState(user.displayName);
  const [loading, setLoading] = useState(false);

  const handleChangeDisplayName = async () => {
    setLoading(true);
    try {
      await updateUserDisplayName(displayName); // Call your server action to update the display name
      await refetchUser(); // Re-fetch the user data to ensure it's up-to-date
    } catch (error) {
      console.error("Failed to update display name:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        disabled={loading}
      />
      <button onClick={handleChangeDisplayName} disabled={loading}>
        {loading ? "Updating..." : "Change user name"}
      </button>
    </div>
  );
};

export default UserProfile;
