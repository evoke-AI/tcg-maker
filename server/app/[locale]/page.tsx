import { Metadata } from 'next'
import TradingCardGeneratorClient from './TradingCardGeneratorClient'

export const metadata: Metadata = {
  title: 'TCG Maker - AI Trading Card Generator',
  description: 'Create stunning, consistent trading card artwork with AI. Powered by Google Gemini 3 Pro Image Generation.',
}

export default function RootPage() {
  return <TradingCardGeneratorClient />
}
