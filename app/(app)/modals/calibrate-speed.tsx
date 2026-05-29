/**
 * VERBUM — Modal: CalibrateSpeed
 * Calibração da velocidade de leitura individual do usuário.
 * Apresenta um trecho bíblico padrão (~200 palavras) e cronometra a leitura.
 */

import { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import { useAuthContext } from '../../../src/context/AuthContext';
import { userRepo } from '../../../src/database/repositories';
import { Button } from '../../../src/components/ui/Button';

// Trecho padrão para calibração — Salmos 23 (~190 palavras em português)
const CALIBRATION_TEXT = `O Senhor é o meu pastor; nada me faltará.
Ele me faz repousar em pastos verdejantes. Leva-me para junto das águas
de descanso; refrigera a minha alma. Guia-me pelas veredas da justiça
por amor do seu nome. Ainda que eu ande pelo vale da sombra da morte,
não temerei mal nenhum, porque tu estás comigo; o teu bordão e o teu
cajado me consolam. Preparas uma mesa perante mim na presença dos meus
adversários; unges a minha cabeça com óleo; o meu cálice transborda.
Certamente que a bondade e a misericórdia me seguirão todos os dias da
minha vida; e habitarei na casa do Senhor por longos dias.`;

const CALIBRATION_WORD_COUNT = 118; // palavras do trecho acima

export default function CalibrateSpeedModal() {
  const { tokens } = useTheme();
  const { user, refreshUser } = useAuthContext();

  const [phase, setPhase] = useState<'intro' | 'reading' | 'done'>('intro');
  const [seconds, setSeconds] = useState(0);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startReading = () => {
    setPhase('reading');
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
  };

  const finishReading = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('done');
  };

  // Calcula minutos por capítulo assumindo capítulo médio de 658 palavras
  const wordsPerMinute = seconds > 0 ? (CALIBRATION_WORD_COUNT / seconds) * 60 : 180;
  const minutesPerChapter = parseFloat((658 / wordsPerMinute).toFixed(1));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await userRepo.updateReadingSpeed(user.id, minutesPerChapter);
    await refreshUser();
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>
          Calibrar Velocidade
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        {/* INTRO */}
        {phase === 'intro' && (
          <>
            <MaterialCommunityIcons name="speedometer" size={48} color={tokens.actionPrimary} style={{ alignSelf: 'center' }} />
            <Text style={{ fontSize: 20, fontWeight: '700', fontFamily: 'serif', color: tokens.textPrimary, textAlign: 'center' }}>
              Descubra seu ritmo
            </Text>
            <Text style={{ fontSize: 15, color: tokens.textSecondary, lineHeight: 24, textAlign: 'center' }}>
              Vamos cronometrar sua leitura de um trecho do Salmo 23. Leia em seu ritmo normal de estudo — sem pressa e sem correr.
            </Text>

            <View style={{ backgroundColor: tokens.bgCard, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: tokens.borderLight }}>
              <Text style={{ fontSize: 15, fontFamily: 'serif', color: tokens.textVerse, lineHeight: 28 }}>
                {CALIBRATION_TEXT}
              </Text>
            </View>

            <Text style={{ fontSize: 12, color: tokens.textTertiary, textAlign: 'center' }}>
              Salmos 23 · ~{CALIBRATION_WORD_COUNT} palavras
            </Text>

            <Button label="Pronto para começar" onPress={startReading} fullWidth />
          </>
        )}

        {/* READING */}
        {phase === 'reading' && (
          <>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Tempo decorrido
              </Text>
              <Text style={{ fontSize: 52, fontWeight: '700', color: tokens.actionPrimary, fontVariant: ['tabular-nums'] }}>
                {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
              </Text>
            </View>

            <View style={{ backgroundColor: tokens.bgCard, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: tokens.borderLight }}>
              <Text style={{ fontSize: 17, fontFamily: 'serif', color: tokens.textVerse, lineHeight: 30 }}>
                {CALIBRATION_TEXT}
              </Text>
            </View>

            <Button label="Terminei de ler" onPress={finishReading} fullWidth />
          </>
        )}

        {/* DONE */}
        {phase === 'done' && (
          <>
            <MaterialCommunityIcons name="check-circle" size={52} color={tokens.success} style={{ alignSelf: 'center' }} />
            <Text style={{ fontSize: 22, fontWeight: '700', fontFamily: 'serif', color: tokens.textPrimary, textAlign: 'center' }}>
              Calibração concluída!
            </Text>

            <View style={{ backgroundColor: tokens.bgCard, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: tokens.borderLight, gap: 12 }}>
              {[
                { label: 'Tempo de leitura', value: `${seconds}s` },
                { label: 'Palavras por minuto', value: `~${Math.round(wordsPerMinute)}` },
                { label: 'Minutos por capítulo', value: `${minutesPerChapter} min` },
              ].map(r => (
                <View key={r.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: tokens.textSecondary }}>{r.label}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.textPrimary }}>{r.value}</Text>
                </View>
              ))}
            </View>

            <Text style={{ fontSize: 13, color: tokens.textTertiary, textAlign: 'center', lineHeight: 20 }}>
              Este valor será usado para calcular o tempo estimado nos seus planos de leitura.
            </Text>

            <Button label="Salvar minha velocidade" onPress={handleSave} loading={saving} fullWidth />
            <Button label="Refazer calibração" variant="ghost" onPress={() => { setPhase('intro'); setSeconds(0); }} fullWidth />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}