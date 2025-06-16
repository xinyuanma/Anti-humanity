/**
 * Cards data for the Cards Against Humanity game
 * Contains hardcoded black and white cards for testing
 */

// Black cards (questions/prompts)
// Each black card has:
// - id: unique identifier
// - text: the prompt text (______ for blanks)
// - pick: number of white cards to pick (usually 1)
const blackCards = [
  // 英文黑卡
  { id: 'b1', text: '______ is my favorite thing.', pick: 1 },
  { id: 'b2', text: 'I never truly understood ______ until I encountered ______.', pick: 2 },
  { id: 'b3', text: 'What\'s that smell?', pick: 1 },
  { id: 'b4', text: 'The class field trip was completely ruined by ______.', pick: 1 },
  { id: 'b5', text: 'When I am President, I will create the Department of ______.', pick: 1 },
  { id: 'b6', text: 'What\'s my secret power?', pick: 1 },
  { id: 'b7', text: 'What gets better with age?', pick: 1 },
  { id: 'b8', text: '______ + ______ = ______.', pick: 3 },
  { id: 'b9', text: 'What made my first kiss so awkward?', pick: 1 },
  { id: 'b10', text: 'Why can\'t I sleep at night?', pick: 1 },
  { id: 'b11', text: 'The new Apple product is just ______ but smaller.', pick: 1 },
  { id: 'b12', text: 'My dating profile says I enjoy ______ and looking for someone who loves ______.', pick: 2 },
  { id: 'b13', text: 'The secret to a successful marriage is ______.', pick: 1 },
  { id: 'b14', text: 'My therapist says my obsession with ______ is completely normal.', pick: 1 },
  { id: 'b15', text: 'The best way to start your morning is with ______.', pick: 1 },
  
  // 中文黑卡
  { id: 'cb1', text: '我妈妈常说，人生就像______。', pick: 1 },
  { id: 'cb2', text: '如果我当选总统，我第一件事就是______。', pick: 1 },
  { id: 'cb3', text: '我的秘密技能是______。', pick: 1 },
  { id: 'cb4', text: '______是我不能告诉别人的爱好。', pick: 1 },
  { id: 'cb5', text: '我梦想中的约会是______和______。', pick: 2 },
  { id: 'cb6', text: '最让我感到放松的事情是______。', pick: 1 },
  { id: 'cb7', text: '我的朋友说我看起来像______。', pick: 1 },
  { id: 'cb8', text: '如果可以回到过去，我一定会______。', pick: 1 },
  { id: 'cb9', text: '我的简历上写着我精通______。', pick: 1 },
  { id: 'cb10', text: '我收到过最奇怪的礼物是______。', pick: 1 },
  { id: 'cb11', text: '我的人生格言是：永远不要在______的时候______。', pick: 2 },
  { id: 'cb12', text: '我最大的成就是______。', pick: 1 },
  { id: 'cb13', text: '下一个流行趋势将会是______。', pick: 1 },
  { id: 'cb14', text: '我童年的梦想是成为______。', pick: 1 },
  { id: 'cb15', text: '我最喜欢的电影是关于______的。', pick: 1 }
];

// White cards (answers)
// Each white card has:
// - id: unique identifier
// - text: the answer text
const whiteCards = [
  // 英文白卡
  { id: 'w1', text: 'A sad panda.' },
  { id: 'w2', text: 'Explosive decompression.' },
  { id: 'w3', text: 'Inappropriate yodeling.' },
  { id: 'w4', text: 'A tiny horse.' },
  { id: 'w5', text: 'A lifetime of sadness.' },
  { id: 'w6', text: 'Puppies!' },
  { id: 'w7', text: 'The inevitable heat death of the universe.' },
  { id: 'w8', text: 'A disappointing birthday party.' },
  { id: 'w9', text: 'Silence.' },
  { id: 'w10', text: 'The violation of our most basic human rights.' },
  { id: 'w11', text: 'An honest cop with nothing left to lose.' },
  { id: 'w12', text: 'Abstinence.' },
  { id: 'w13', text: 'A balanced breakfast.' },
  { id: 'w14', text: 'A tiny, sailboat-riding dog.' },
  { id: 'w15', text: 'Passive-aggressive Post-it notes.' },
  { id: 'w16', text: 'Inappropriate timing.' },
  { id: 'w17', text: 'The miracle of childbirth.' },
  { id: 'w18', text: 'The wifi password.' },
  { id: 'w19', text: 'Extremely tight pants.' },
  { id: 'w20', text: 'A really cool hat.' },
  { id: 'w21', text: 'Not contributing to society in any meaningful way.' },
  { id: 'w22', text: 'A subscription to a streaming service you forgot about.' },
  { id: 'w23', text: 'The unstoppable march of time.' },
  { id: 'w24', text: 'A moment of silence.' },
  { id: 'w25', text: 'Exactly what you\'d expect.' },
  { id: 'w26', text: 'An old man on roller skates.' },
  { id: 'w27', text: 'The entire Internet.' },
  { id: 'w28', text: 'A burrito with extra guacamole.' },
  { id: 'w29', text: 'The Illuminati.' },
  { id: 'w30', text: 'Being on fire.' },
  { id: 'w31', text: 'Accidentally sending a text to your mom that was meant for your date.' },
  { id: 'w32', text: 'A LinkedIn request from your ex.' },
  { id: 'w33', text: 'Pretending to understand cryptocurrency.' },
  { id: 'w34', text: 'A TikTok dance that went horribly wrong.' },
  { id: 'w35', text: 'Zoom meetings without pants.' },
  { id: 'w36', text: 'The existential dread of a Sunday evening.' },
  { id: 'w37', text: 'Eating an entire pizza by yourself.' },
  { id: 'w38', text: 'A social media detox that lasted 3 hours.' },
  { id: 'w39', text: 'Binge-watching an entire series in one sitting.' },
  { id: 'w40', text: 'That one friend who always has to one-up your stories.' },
  
  // 中文白卡
  { id: 'cw1', text: '熬夜追剧的后果。' },
  { id: 'cw2', text: '假装在听别人说话。' },
  { id: 'cw3', text: '一个神秘的微信红包。' },
  { id: 'cw4', text: '外卖小哥的微笑。' },
  { id: 'cw5', text: '考试前的突击复习。' },
  { id: 'cw6', text: '深夜的泡面。' },
  { id: 'cw7', text: '社交恐惧症发作。' },
  { id: 'cw8', text: '假装工作的样子。' },
  { id: 'cw9', text: '朋友圈里的旅游照片。' },
  { id: 'cw10', text: '三天没洗的头发。' },
  { id: 'cw11', text: '过期的优惠券。' },
  { id: 'cw12', text: '健身房年卡的第一天。' },
  { id: 'cw13', text: '购物车里永远不会买的东西。' },
  { id: 'cw14', text: '假装看懂艺术展。' },
  { id: 'cw15', text: '家庭群里的养生谣言。' },
  { id: 'cw16', text: '公司团建的尴尬游戏。' },
  { id: 'cw17', text: '被遗忘的共享单车密码。' },
  { id: 'cw18', text: '电梯里的尴尬沉默。' },
  { id: 'cw19', text: '深夜的哲学思考。' },
  { id: 'cw20', text: '忘带钥匙的绝望。' },
  { id: 'cw21', text: '假装听懂别人的笑话。' },
  { id: 'cw22', text: '过度解读对方的信息。' },
  { id: 'cw23', text: '不小心点赞了前任的照片。' },
  { id: 'cw24', text: '装作很忙的样子。' },
  { id: 'cw25', text: '对快递员说"你也是"。' },
  { id: 'cw26', text: '假装喜欢收到的礼物。' },
  { id: 'cw27', text: '忘记静音的视频会议。' },
  { id: 'cw28', text: '深夜的网购冲动。' },
  { id: 'cw29', text: '被父母催婚。' },
  { id: 'cw30', text: '假装理解比特币。' }
];

module.exports = {
  blackCards,
  whiteCards
}; 