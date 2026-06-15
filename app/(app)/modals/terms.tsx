/**
 * VERBUM — app/(app)/modals/terms.tsx
 * Termos de Uso
 *
 * FIX: children: string → children: React.ReactNode
 * (JSX trata "texto {var} texto" como array, não string simples)
 */

import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router }            from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';

const LAST_UPDATED = '05 de junho de 2025';
const APP_NAME     = 'Verbum';
const CONTACT      = 'verbumapp.contato@gmail.com';

export default function TermsModal() {
  const { tokens } = useTheme();
  const insets     = useSafeAreaInsets();

  const H1 = ({ children }: { children: ReactNode }) => (
    <Text style={{ fontSize: 20, fontWeight: '800', color: tokens.textPrimary, marginBottom: 8, marginTop: 24, letterSpacing: -0.3 }}>{children}</Text>
  );
  const H2 = ({ children }: { children: ReactNode }) => (
    <Text style={{ fontSize: 15, fontWeight: '700', color: tokens.textPrimary, marginBottom: 6, marginTop: 18 }}>{children}</Text>
  );
  const P = ({ children }: { children: ReactNode }) => (
    <Text style={{ fontSize: 14, color: tokens.textSecondary, lineHeight: 24, marginBottom: 8 }}>{children}</Text>
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
      <View style={{ paddingTop: 8, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: tokens.borderLight, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>Termos de Uso</Text>
          <Text style={{ fontSize: 11, color: tokens.textTertiary }}>Atualizado em {LAST_UPDATED}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 48 }} showsVerticalScrollIndicator={false}>
        <H1>Termos de Uso</H1>
        <P>Ao instalar ou usar o aplicativo {APP_NAME}, você concorda com estes Termos de Uso. Leia com atenção antes de utilizar o app. Se não concordar, não utilize o {APP_NAME}.</P>

        <Divider />

        <H1>1. Sobre o aplicativo</H1>
        <P>O {APP_NAME} é um aplicativo gratuito de leitura e estudo bíblico para dispositivos Android, desenvolvido para pregadores, teólogos e estudantes da Palavra. Oferece planos de leitura, caderno do pregador, mapas temáticos e outras ferramentas de estudo.</P>

        <Divider />

        <H1>2. Uso permitido</H1>
        <P>Você pode usar o {APP_NAME} para:</P>
        <Li>Leitura pessoal e devocional da Bíblia.</Li>
        <Li>Estudo bíblico individual ou em grupo.</Li>
        <Li>Preparação de sermões, pregações e estudos.</Li>
        <Li>Anotações e reflexões pessoais de fé.</Li>

        <Divider />

        <H1>3. Uso proibido</H1>
        <P>É expressamente proibido:</P>
        <Li>Usar o app para fins comerciais sem nossa autorização prévia por escrito.</Li>
        <Li>Tentar acessar, copiar ou distribuir o código-fonte do aplicativo.</Li>
        <Li>Usar engenharia reversa, descompilar ou desmontar o app.</Li>
        <Li>Usar o app de qualquer forma que viole leis brasileiras ou internacionais.</Li>
        <Li>Criar contas falsas ou se passar por outra pessoa.</Li>
        <Li>Tentar burlar medidas de segurança do aplicativo.</Li>

        <Divider />

        <H1>4. Conteúdo bíblico</H1>
        <P>Os textos bíblicos são obtidos via API pública (BíbliaAPI). O {APP_NAME} não reivindica propriedade sobre os textos bíblicos. As versões utilizadas (ACF, NVI, ARA, NAA) estão sob seus respectivos direitos autorais e são usadas conforme suas licenças de uso livre para fins não comerciais e de estudo.</P>

        <Divider />

        <H1>5. Conteúdo gerado pelo usuário</H1>
        <P>Anotações, sermões, entradas do diário e outros conteúdos que você cria no {APP_NAME} são de sua inteira responsabilidade. Você mantém todos os direitos sobre seu conteúdo. Ao criar conteúdo no app, você garante que não viola direitos de terceiros.</P>

        <Divider />

        <H1>6. Propriedade intelectual</H1>
        <P>O {APP_NAME}, incluindo seu nome, ícone, design, funcionalidades e código-fonte, são propriedade dos desenvolvedores e protegidos por leis de direitos autorais. Nada nestes termos transfere qualquer direito de propriedade intelectual para você.</P>

        <Divider />

        <H1>7. Disponibilidade e atualizações</H1>
        <P>Nos reservamos o direito de modificar, suspender ou descontinuar o {APP_NAME} a qualquer momento, com ou sem aviso prévio. Podemos lançar atualizações que alterem funcionalidades existentes. O uso continuado após atualizações implica aceitação das mudanças.</P>

        <Divider />

        <H1>8. Limitação de responsabilidade</H1>
        <P>O {APP_NAME} é fornecido {`"como está"`}, sem garantias de qualquer tipo. Não somos responsáveis por:</P>
        <Li>Perda de dados causada por desinstalação, reset de dispositivo ou falha técnica.</Li>
        <Li>Interpretações teológicas feitas com base no conteúdo do app.</Li>
        <Li>Indisponibilidade do serviço de API bíblica de terceiros.</Li>
        <Li>Danos indiretos, incidentais ou consequentes decorrentes do uso do app.</Li>
        <P>Nossa responsabilidade total está limitada ao valor pago pelo app (R$ 0,00, pois é gratuito).</P>

        <Divider />

        <H1>9. Rescisão</H1>
        <P>Podemos encerrar seu acesso ao {APP_NAME} se você violar estes termos. Você pode parar de usar o app a qualquer momento desinstalando-o. Ao desinstalar, todos os dados locais são removidos.</P>

        <Divider />

        <H1>10. Lei aplicável e foro</H1>
        <P>Estes Termos são regidos pelas leis brasileiras. Para resolução de conflitos, fica eleito o foro da comarca de Recife, Pernambuco, Brasil, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</P>

        <Divider />

        <H1>11. Alterações nos termos</H1>
        <P>Podemos atualizar estes Termos periodicamente. A versão mais recente estará sempre disponível no aplicativo. O uso continuado após alterações constitui aceite dos novos termos.</P>

        <Divider />

        <H1>12. Contato</H1>
        <P>Dúvidas ou solicitações: {CONTACT}</P>

        <View style={{ marginTop: 24, padding: 14, backgroundColor: tokens.actionPrimary + '10', borderRadius: 12, borderWidth: 1, borderColor: tokens.actionPrimary + '30' }}>
          <Text style={{ fontSize: 12, color: tokens.actionPrimary, lineHeight: 18, textAlign: 'center', fontWeight: '600' }}>
            Ao usar o {APP_NAME} você declara ter lido, compreendido e aceitado estes Termos de Uso.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}