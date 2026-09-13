import { Select } from './components/ui/select';
import { useIntl, useLocale } from './intl/setup';
import { useLocalePreference } from './intl/provider';
import { isLocale } from './intl/locale';
import './LanguageSelect.css';
import { Caption } from './components/ui/text';

export function LanguageSelect({
  showLabel = true,
  variant,
}: {
  showLabel?: boolean;
  variant?: 'control' | 'quiet';
}) {
  const t = useIntl();
  const locale = useLocale();
  const { setLocale } = useLocalePreference();

  return (
    <label className="language-select">
      {showLabel ? <Caption as="span">{t('language.label')}</Caption> : null}
      <Select
        variant={variant}
        data-testid="language-select"
        aria-label={t('language.label')}
        value={locale}
        onChange={(event) => {
          if (isLocale(event.target.value)) setLocale(event.target.value);
        }}
      >
        <option value="en">{t('language.name.en')}</option>
        <option value="de">{t('language.name.de')}</option>
      </Select>
    </label>
  );
}
