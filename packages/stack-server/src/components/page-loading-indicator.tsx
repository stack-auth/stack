import { Box, LinearProgress } from "@mui/joy";

export function PageLoadingIndicator() {
  return (
    <Box>
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={9999999}
        sx={{
          pointerEvents: "none",
          backgroundColor: "green",
        }}
      >
        <LinearProgress
          variant="solid"
          color="danger"
          sx={{
            width: '100%',
            "--LinearProgress-thickness": "5px",
            "--LinearProgress-radius": "0px",
            "--LinearProgress-progressRadius": "5px"      
          }}
        />
      </Box>
    </Box>
  );
}
