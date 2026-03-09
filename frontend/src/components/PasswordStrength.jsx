import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const IconCheck = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const PasswordStrength = ({ password }) => {
    if (!password) return null;

    const getStrength = (pwd) => {
        let score = 0;
        const len = pwd.length;

        // 1️⃣ Tamanho da senha
        if (len >= 6 && len <= 7) score += 1;
        else if (len >= 8 && len <= 11) score += 2;
        else if (len >= 12) score += 3;

        let typesCount = 0;
        // 2️⃣ Letras minúsculas
        if (/[a-z]/.test(pwd)) { typesCount++; score += 1; }
        // 3️⃣ Letras maiúsculas
        if (/[A-Z]/.test(pwd)) { typesCount++; score += 1; }
        // 4️⃣ Números
        if (/\d/.test(pwd)) { typesCount++; score += 1; }
        // 5️⃣ Caracteres especiais
        if (/[!@#$%^&*()_+\-=[\]{};':",.<>/?]/.test(pwd)) { typesCount++; score += 1; }

        // 6️⃣ Combinação forte
        if (typesCount >= 3) score += 1;

        return score;
    };

    const score = getStrength(password);

    const getLevel = (s) => {
        if (s <= 2) return { label: 'Senha ruim', bars: 1, color: '#e74c3c' }; // Red
        if (s <= 4) return { label: 'Quase lá', bars: 2, color: '#f39c12' }; // Orange
        if (s <= 6) return { label: 'Boa', bars: 3, color: '#f1c40f' }; // Yellow
        return { label: 'Perfeita', bars: 4, color: 'rgb(72 92 17)' }; // Theme Green
    };

    const level = getLevel(score);

    const dicas = [
        { text: 'Pelo menos 6 caracteres', met: password.length >= 6 },
        { text: 'Maiúsculas e minúsculas', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
        { text: 'Números e símbolos', met: /\d/.test(password) && /[!@#$%^&*()_+\-=[\]{};':",.<>/?]/.test(password) },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={s.container}
        >
            {/* Label and Status */}
            <div style={s.header}>
                <span style={s.label}>Força da senha</span>
                <motion.span
                    key={level.label}
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ ...s.status, color: level.color }}
                >
                    {level.label}
                </motion.span>
            </div>

            {/* Progress Bars */}
            <div style={s.barWrapper}>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={s.barBg}>
                        <motion.div
                            animate={{
                                width: i <= level.bars ? '100%' : '0%',
                                background: level.color
                            }}
                            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                            style={s.barFill}
                        />
                    </div>
                ))}
            </div>

            {/* Requirements */}
            <div style={s.dicasWrapper}>
                {dicas.map((dica, idx) => (
                    <div key={idx} style={{
                        ...s.dica,
                        color: dica.met ? 'rgb(72 92 17)' : '#8c8c82',
                        opacity: dica.met ? 1 : 0.7
                    }}>
                        <div style={{
                            ...s.iconWrap,
                            background: dica.met ? 'rgba(72,92,17,0.1)' : 'rgba(0,0,0,0.04)',
                            color: dica.met ? 'rgb(72 92 17)' : 'transparent'
                        }}>
                            {dica.met && <IconCheck />}
                        </div>
                        {dica.text}
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

const s = {
    container: {
        padding: '8px 4px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        fontFamily: '"Inter", sans-serif',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    label: {
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#8c8c82',
    },
    status: {
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '-0.2px',
    },
    barWrapper: {
        display: 'flex',
        gap: 6,
        height: 6,
    },
    barBg: {
        flex: 1,
        height: '100%',
        background: 'rgba(0,0,0,0.06)',
        borderRadius: 10,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 10,
    },
    dicasWrapper: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px 16px',
        marginTop: 2,
    },
    dica: {
        fontSize: 11.5,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.3s ease',
    },
    iconWrap: {
        width: 16,
        height: 16,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
    }
};

export default PasswordStrength;

