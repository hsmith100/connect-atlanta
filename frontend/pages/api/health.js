export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    message: 'NextJS Frontend Running',
    timestamp: new Date().toISOString()
  })
}