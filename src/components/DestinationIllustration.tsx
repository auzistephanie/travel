import { useTheme } from '../theme/ThemeContext'
import { JapanIllustration } from '../theme/illustrations/JapanIllustration'
import { ThailandIllustration } from '../theme/illustrations/ThailandIllustration'
import { KoreaIllustration } from '../theme/illustrations/KoreaIllustration'
import { TaiwanIllustration } from '../theme/illustrations/TaiwanIllustration'
import { VietnamIllustration } from '../theme/illustrations/VietnamIllustration'
import { GenericIllustration } from '../theme/illustrations/GenericIllustration'

const ILLUSTRATIONS: Record<string, () => React.JSX.Element> = {
  JP: JapanIllustration,
  TH: ThailandIllustration,
  KR: KoreaIllustration,
  TW: TaiwanIllustration,
  VN: VietnamIllustration,
}

interface DestinationIllustrationProps {
  countryCode: string | null
  width?: number
  className?: string
}

export function DestinationIllustration({ countryCode, width, className }: DestinationIllustrationProps) {
  const { tokens } = useTheme()
  const Illustration = (countryCode && ILLUSTRATIONS[countryCode]) || GenericIllustration
  const classes = ['destination-illustration', className].filter(Boolean).join(' ')

  return (
    <div className={classes} style={{ filter: tokens.illustrationFilter, width }}>
      <Illustration />
    </div>
  )
}
