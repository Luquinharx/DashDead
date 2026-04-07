import os

filepath = r'c:\Users\Lucas\Desktop\dash\DashDead-main\frontend\src\components\pages\CasinoSettings.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'Erro: As chances somam': 'Error: Chances sum to',
    'O total deve ser exatamente 100%.': 'The total must be exactly 100%.',
    'Configurações salvas com sucesso!': 'Settings saved successfully!',
    'Erro ao salvar as configurações.': 'Error saving settings.',
    'Probabilidades de Recompensa': 'Reward Probabilities',
    'Configure os prêmios, chances e cores da roleta. O total deve ser 100%.': 'Configure the prizes, chances, and colors of the roulette. The total must be 100%.',
    'Nome do Prêmio': 'Prize Name',
    'Valor (ex: 500k)': 'Value (ex: 500k)',
    'Chance (%)': 'Chance (%)',
    'Ícone': 'Icon',
    'Cor (Tailwind)': 'Color (Tailwind)',
    'Ação': 'Action',
    'Novo prêmio': 'New prize',
    'Adicionar Prêmio': 'Add Prize',
    'Regras de Conversão (Loot -> Spins)': 'Conversion Rules (Loot -> Spins)',
    'Configuração base de quantas doações (loot/dinheiro) geram giros na roleta.': 'Base configuration for how many donations (loot/money) generate roulette spins.',
    'Tipo de Conta': 'Account Type',
    'Requisito Base': 'Base Requirement',
    'Spins Ganhos': 'Spins Generated',
    'Exemplo: Se configurado para 1 resultar em 2 spins, uma doação total de 5 resultará em': 'Example: If configured to 1 resulting in 2 spins, a total donation of 5 will result in',
    'spins automáticos no total da conta do membro.': 'automatic spins on the member total account.',
    'Salvar Configurações': 'Save Settings'
}

for pt, en in replacements.items():
    content = content.replace(pt, en)
    
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
