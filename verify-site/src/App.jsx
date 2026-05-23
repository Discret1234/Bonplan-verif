const CLIENT_ID = "1507490653905354996"

const REDIRECT = encodeURIComponent(
  "http://localhost:5173/callback"
)

const URL =
  `https://discord.com/oauth2/authorize` +
  `?client_id=${CLIENT_ID}` +
  `&response_type=code` +
  `&redirect_uri=${REDIRECT}` +
  `&scope=identify%20guilds.join`

export default function App() {
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      gap: "20px",
      background: "#0f0f0f",
      color: "white"
    }}>
      <h1>BONPLAN VERIFY</h1>

      <a href={URL}>
        <button style={{
          padding: "15px 30px",
          fontSize: "18px",
          cursor: "pointer"
        }}>
          Vérifier avec Discord
        </button>
      </a>
    </div>
  )
}