/**
import type { ReactNode } from 'react';
 * VERBUM — app/(app)/modals/privacy-policy.tsx
 * Política de Privacidade — conforme LGPD (Lei nº 13.709/2018)
 */

import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router }            from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import { ReactNode } from 'react';

const LAST_UPDATED = '05 de junho de 2025';
const APP_NAME     = 'Verbum';
const CONTACT      = 'verbumapp.contato@gmail.com'; // ← atualize com seu e-mail

export default function PrivacyPolicyModal() {
  const { tokens } = useTheme();
  const insets     = useSafeAreaInsets();

  const H1 = ({ children }: { children: ReactNode }) => (
    <Text style={{ fontSize: 20, fontWeight: '800', color: tokens.textPrimary, marginBottom: 8, marginTop: 24, letterSpacing: -0.3 }}>
      {children}
    </Text>
  );

  const H2 = ({ children }: { children: ReactNode }) => (
    <Text style={{ fontSize: 15, fontWeight: '700', color: tokens.textPrimary, marginBottom: 6, marginTop: 18 }}>
      {children}
    </Text>
  );

  const P = ({ children }: { children: ReactNode }) => (
    <Text style={{ fontSize: 14, color: tokens.textSecondary, lineHeight: 24, marginBottom: 8 }}>
      {children}
    </Text>
  );

  const Li = ({ children }: { children: ReactNode }) => (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
      <Text style={{ color: tokens.actionPrimary, marginTop: 2 }}>•</Text>
      <Text style={{ flex: 1, fontSize: 14, color: tokens.textSecondary, lineHeight: 22 }}>{children}</Text>
    </View>
  );

  const Divider = () => (
    <View style={{ height: 1, backgroundColor: tokens.borderLight, marginVertical: 8 }} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      {/* Header */}
      <View style={{ paddingTop: 8, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: tokens.borderLight, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>Política de Privacidade</Text>
          <Text style={{ fontSize: 11, color: tokens.textTertiary }}>Atualizada em {LAST_UPDATED}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
      >
        <H1>Política de Privacidade</H1>
        <P>
          Esta Política de Privacidade descreve como o aplicativo {APP_NAME} {`("nós", "nosso")`} coleta, usa e protege as informações dos usuários {`("você")`}, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018).
        </P>
        <P>Ao usar o {APP_NAME}, você concorda com esta política. Se não concordar, não utilize o aplicativo.</P>

        <Divider />

        <H1>1. Dados que coletamos</H1>

        <H2>1.1 Dados fornecidos por você</H2>
        <Li>Nome: usado para personalizar sua experiência no aplicativo.</Li>
        <Li>Endereço de e-mail: usado como identificador único da sua conta local.</Li>

        <H2>1.2 Dados gerados pelo uso</H2>
        <Li>Progresso de leitura: capítulos lidos, planos de leitura criados e histórico de sessões.</Li>
        <Li>Anotações e favoritos: textos e destaques que você cria nos versículos.</Li>
        <Li>Preferências: tema visual, versão bíblica e tamanho de fonte escolhidos.</Li>
        <Li>Diário espiritual: entradas que você escreve voluntariamente.</Li>

        <H2>1.3 Dados que NÃO coletamos</H2>
        <Li>Não coletamos localização geográfica.</Li>
        <Li>Não acessamos câmera, microfone ou galeria de fotos.</Li>
        <Li>Não utilizamos analytics ou rastreadores de comportamento.</Li>
        <Li>Não coletamos dados de pagamento (o app é gratuito).</Li>
        <Li>Não coletamos informações de outros aplicativos no dispositivo.</Li>

        <Divider />

        <H1>2. Como usamos seus dados</H1>
        <P>Seus dados são usados exclusivamente para:</P>
        <Li>Criar e manter sua conta local no dispositivo.</Li>
        <Li>Salvar e recuperar seu progresso de leitura entre sessões.</Li>
        <Li>Personalizar a experiência com suas preferências.</Li>
        <Li>Permitir acesso às funcionalidades do Caderno do Pregador e Mapas Temáticos.</Li>

        <Divider />

        <H1>3. Onde seus dados ficam armazenados</H1>
        <P>
          TODOS os seus dados são armazenados LOCALMENTE no seu dispositivo, em um banco de dados SQLite protegido pelo sistema operacional Android. Nenhum dado pessoal é transmitido para nossos servidores ou para qualquer servidor externo.
        </P>
        <H2>Exceção — API Bíblica</H2>
        <P>
          Para carregar o texto bíblico, o aplicativo realiza requisições à API pública BíbliaAPI (bibliaapi.com.br). Essas requisições incluem apenas o livro e capítulo solicitados — nunca dados pessoais seus. A política de privacidade da BíbliaAPI é responsabilidade deles.
        </P>

        <Divider />

        <H1>4. Compartilhamento de dados</H1>
        <P>
          Não vendemos, alugamos, cedemos ou compartilhamos seus dados pessoais com terceiros, exceto quando exigido por lei ou ordem judicial.
        </P>

        <Divider />

        <H1>5. Por quanto tempo mantemos seus dados</H1>
        <P>
          Seus dados permanecem no seu dispositivo enquanto o aplicativo estiver instalado. Ao desinstalar o {APP_NAME}, todos os dados são removidos automaticamente pelo sistema operacional. Você também pode excluir sua conta a qualquer momento nas Configurações do app.
        </P>

        <Divider />

        <H1>6. Seus direitos (LGPD Art. 18)</H1>
        <P>Como titular dos dados, você tem direito a:</P>
        <Li>Confirmação da existência de tratamento dos seus dados.</Li>
        <Li>Acesso aos dados — todos disponíveis na tela de Configurações.</Li>
        <Li>Correção de dados incompletos ou imprecisos.</Li>
        <Li>Exclusão dos dados tratados com seu consentimento.</Li>
        <Li>Portabilidade dos dados (mediante solicitação).</Li>
        <Li>Revogação do consentimento a qualquer momento.</Li>
        <P>
          Para exercer qualquer um desses direitos, entre em contato: {CONTACT}
        </P>

        <Divider />

        <H1>7. Segurança dos dados</H1>
        <P>
          Adotamos medidas técnicas para proteger seus dados: armazenamento criptografado via SQLite no dispositivo, e uso de Expo SecureStore para dados sensíveis de sessão. Nenhum sistema é 100% seguro, mas fazemos o possível para proteger suas informações.
        </P>

        <Divider />

        <H1>8. Menores de idade</H1>
        <P>
          O {APP_NAME} não é destinado a menores de 13 anos. Não coletamos conscientemente dados de crianças. Se você acredita que um menor forneceu dados, entre em contato para que possamos tomar as medidas cabíveis.
        </P>

        <Divider />

        <H1>9. Alterações nesta política</H1>
        <P>
          Podemos atualizar esta política periodicamente. Alterações significativas serão comunicadas dentro do aplicativo. O uso continuado após as alterações implica aceitação da nova política.
        </P>

        <Divider />

        <H1>10. Contato e Controlador de Dados</H1>
        <P>
          Responsável pelo tratamento dos dados (Controlador conforme LGPD Art. 5º, VI):
        </P>
        <P>
          Aplicativo: {APP_NAME}{'\n'}
          E-mail: {CONTACT}{'\n'}
          País: Brasil
        </P>

        {/* Badge LGPD */}
        <View style={{ marginTop: 24, padding: 14, backgroundColor: tokens.actionPrimary + '10', borderRadius: 12, borderWidth: 1, borderColor: tokens.actionPrimary + '30', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <MaterialCommunityIcons name="shield-check-outline" size={22} color={tokens.actionPrimary} />
          <Text style={{ flex: 1, fontSize: 12, color: tokens.actionPrimary, lineHeight: 18 }}>
            Este documento atende aos requisitos da LGPD (Lei nº 13.709/2018) e da Resolução CD/ANPD nº 2/2022.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}