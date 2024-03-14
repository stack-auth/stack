import { useDesign } from "../utils/provider";

export default function Divider({ direction='horizontal' }: { direction?: 'horizontal' | 'vertical'}) {
  const { colors } = useDesign();
  return <hr style={{ 
    width: direction === 'horizontal' ? '100%' : '1px', 
    height: direction === 'horizontal' ? '1px' : undefined,
    border: 'none', 
    backgroundColor: colors.neutralColor,
    alignSelf: 'stretch',
    margin: 0,
    padding: 0,
  }} />;
}