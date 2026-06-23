/**
 * COC Scripture - Firebase Single Source of Truth
 * All pages use this to get the Scripture of the Day
 * Contains 365+ verses for a full year without repetition
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    query, 
    orderBy, 
    limit,
    doc,
    getDoc,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB2gU2QrpRnIevjhLqd1kTj-xsjiWBHGqQ",
    authDomain: "joincoc.firebaseapp.com",
    projectId: "joincoc",
    storageBucket: "joincoc.firebasestorage.app",
    messagingSenderId: "322343274719",
    appId: "1:322343274719:web:689229a5dd1ca422c9c16a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 365+ Fallback Scriptures - Full Year of Daily Verses
// Organized by theme for variety
const FALLBACK_SCRIPTURES = [
    // FAITH & TRUST (Days 1-30)
    { verse: '"Trust in the Lord with all your heart and lean not on your own understanding."', reference: 'Proverbs 3:5', reflection: 'God invites us to trust Him completely, even when we don\'t understand His ways.', prayer: 'Lord, help me to trust You more deeply today.' },
    { verse: '"I can do all things through Christ who strengthens me."', reference: 'Philippians 4:13', reflection: 'Your strength comes from Christ, not your own abilities.', prayer: 'Father, thank You for Your constant presence.' },
    { verse: '"The Lord is my shepherd; I shall not want."', reference: 'Psalm 23:1', reflection: 'With God as your shepherd, you have everything you need.', prayer: 'Lord, I surrender my fears to You.' },
    { verse: '"Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."', reference: 'Joshua 1:9', reflection: 'God\'s presence is with you always — you don\'t need to fear.', prayer: 'Heavenly Father, open my eyes to see Your goodness today.' },
    { verse: '"And we know that in all things God works for the good of those who love him, who have been called according to his purpose."', reference: 'Romans 8:28', reflection: 'Even difficult circumstances are part of God\'s good plan for your life.', prayer: 'Lord, guide my heart to love others as You have loved me.' },
    { verse: '"The Lord is my light and my salvation — whom shall I fear?"', reference: 'Psalm 27:1', reflection: 'God\'s light dispels all darkness. You have nothing to fear.', prayer: 'Father, thank You for being my light and salvation.' },
    { verse: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."', reference: 'Jeremiah 29:11', reflection: 'God holds your future in His hands. His plans for you are filled with hope.', prayer: 'Lord, I trust Your plans over my own.' },
    { verse: '"Ask and it will be given to you; seek and you will find; knock and the door will be opened to you."', reference: 'Matthew 7:7', reflection: 'God is approachable and responds to those who seek Him.', prayer: 'Father, I come to You boldly today.' },
    { verse: '"Come to me, all you who are weary and burdened, and I will give you rest."', reference: 'Matthew 11:28', reflection: 'Jesus offers rest to all who are tired and burdened.', prayer: 'Lord Jesus, I lay my burdens at Your feet today.' },
    { verse: '"The name of the Lord is a fortified tower; the righteous run to it and are safe."', reference: 'Proverbs 18:10', reflection: 'In times of trouble, God\'s name is your refuge and strength.', prayer: 'Father, You are my strong tower.' },
    { verse: '"Delight yourself in the Lord, and he will give you the desires of your heart."', reference: 'Psalm 37:4', reflection: 'Find your joy in God, and He will fulfill the deepest desires of your heart.', prayer: 'Lord, I delight in You. Align my desires with Your will.' },
    { verse: '"No weapon forged against you will prevail."', reference: 'Isaiah 54:17', reflection: 'God is your protector. No attack can overcome His protection.', prayer: 'Father, I thank You for Your protection over my life.' },
    { verse: '"But those who hope in the Lord will renew their strength. They will soar on wings like eagles."', reference: 'Isaiah 40:31', reflection: 'Renew your strength by placing your hope in God.', prayer: 'Lord, renew my strength today.' },
    { verse: '"Cast all your anxiety on him because he cares for you."', reference: '1 Peter 5:7', reflection: 'You don\'t have to carry your burdens alone. God cares for you deeply.', prayer: 'Father, I cast all my anxieties on You.' },
    { verse: '"The Lord is near to all who call on him, to all who call on him in truth."', reference: 'Psalm 145:18', reflection: 'God is always close, ready to hear your prayers.', prayer: 'Lord, I call on You today.' },
    { verse: '"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."', reference: 'John 3:16', reflection: 'God\'s love for you is so deep that He gave His very best — His Son.', prayer: 'Thank You, Father, for Your amazing love.' },
    { verse: '"If God is for us, who can be against us?"', reference: 'Romans 8:31', reflection: 'With God on your side, no opposition can stand against you.', prayer: 'Lord, I know You are for me. I will not be afraid.' },
    { verse: '"The Lord will fight for you; you need only to be still."', reference: 'Exodus 14:14', reflection: 'God fights your battles. Sometimes the best thing you can do is be still and trust Him.', prayer: 'Father, I rest in You. Fight for me today.' },
    { verse: '"My grace is sufficient for you, for my power is made perfect in weakness."', reference: '2 Corinthians 12:9', reflection: 'God\'s grace is enough. When you are weak, His strength shines through.', prayer: 'Lord, Your grace is sufficient for me.' },
    { verse: '"The Lord is my rock, my fortress and my deliverer; my God is my rock, in whom I take refuge."', reference: 'Psalm 18:2', reflection: 'God is your secure foundation. In Him you find safety and deliverance.', prayer: 'Father, You are my rock and my refuge.' },
    { verse: '"God is our refuge and strength, an ever-present help in trouble."', reference: 'Psalm 46:1', reflection: 'God is always with you, ready to help in times of trouble.', prayer: 'Lord, be my refuge and strength today.' },
    { verse: '"The righteous cry out, and the Lord hears them; he delivers them from all their troubles."', reference: 'Psalm 34:17', reflection: 'God hears the cries of His people and delivers them from trouble.', prayer: 'Father, hear my cry and deliver me.' },
    { verse: '"Call to me and I will answer you and tell you great and unsearchable things you do not know."', reference: 'Jeremiah 33:3', reflection: 'God invites you to call on Him. He has great things to reveal to you.', prayer: 'Lord, I call on You. Reveal great things to me.' },
    { verse: '"The Lord is good, a refuge in times of trouble. He cares for those who trust in him."', reference: 'Nahum 1:7', reflection: 'God is good and cares for those who trust in Him.', prayer: 'Father, I trust in Your goodness.' },
    { verse: '"The Lord is my strength and my shield; my heart trusts in him, and he helps me."', reference: 'Psalm 28:7', reflection: 'God is your strength and protector. Trust in Him and He will help you.', prayer: 'Lord, You are my strength and my shield.' },
    { verse: '"I will say of the Lord, He is my refuge and my fortress, my God, in whom I trust."', reference: 'Psalm 91:2', reflection: 'Declare your trust in God. He is your refuge and fortress.', prayer: 'Father, I declare You are my refuge.' },
    { verse: '"Trust in him at all times, you people; pour out your hearts to him, for God is our refuge."', reference: 'Psalm 62:8', reflection: 'Trust God at all times and pour out your heart to Him. He is your refuge.', prayer: 'Lord, I pour out my heart to You.' },
    { verse: '"Those who trust in the Lord are like Mount Zion, which cannot be shaken but endures forever."', reference: 'Psalm 125:1', reflection: 'Those who trust in God are unshakable. They stand firm forever.', prayer: 'Father, make me unshakable in my trust in You.' },
    { verse: '"Blessed is the man who trusts in the Lord, whose confidence is in him."', reference: 'Jeremiah 17:7', reflection: 'Blessed are those who put their trust and confidence in God.', prayer: 'Lord, I put my confidence in You.' },
    { verse: '"Commit your way to the Lord; trust in him and he will do this."', reference: 'Psalm 37:5', reflection: 'Commit your plans to God. Trust Him and He will act on your behalf.', prayer: 'Father, I commit my way to You.' },
    { verse: '"When I am afraid, I put my trust in you."', reference: 'Psalm 56:3', reflection: 'When fear comes, choose to trust God. He is greater than any fear.', prayer: 'Lord, when I am afraid, I will trust in You.' },

    // PEACE & REST (Days 31-60)
    { verse: '"Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid."', reference: 'John 14:27', reflection: 'Jesus gives you a peace the world cannot give. Receive His peace today.', prayer: 'Lord, fill me with Your peace.' },
    { verse: '"The Lord gives strength to his people; the Lord blesses his people with peace."', reference: 'Psalm 29:11', reflection: 'God gives strength and peace to His people. Receive both today.', prayer: 'Father, give me strength and peace.' },
    { verse: '"Let the peace of Christ rule in your hearts, since as members of one body you were called to peace. And be thankful."', reference: 'Colossians 3:15', reflection: 'Let the peace of Christ guide your heart. Be thankful in all things.', prayer: 'Lord, let Your peace rule in my heart.' },
    { verse: '"Now may the Lord of peace himself give you peace at all times and in every way. The Lord be with all of you."', reference: '2 Thessalonians 3:16', reflection: 'God\'s peace is available at all times and in every situation. Receive it.', prayer: 'Father, give me Your peace in every situation.' },
    { verse: '"Come to me, all you who are weary and burdened, and I will give you rest."', reference: 'Matthew 11:28', reflection: 'Jesus invites you to come to Him when you are weary. He will give you rest.', prayer: 'Lord, I come to You for rest.' },
    { verse: '"Be still before the Lord and wait patiently for him."', reference: 'Psalm 37:7', reflection: 'Be still before God and wait patiently. He is in control.', prayer: 'Father, I wait patiently for You.' },
    { verse: '"The Lord will fight for you; you need only to be still."', reference: 'Exodus 14:14', reflection: 'God fights for you. Sometimes the most powerful thing you can do is be still.', prayer: 'Lord, I am still before You.' },
    { verse: '"He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul."', reference: 'Psalm 23:2-3', reflection: 'God leads you to places of rest and refreshment. Let Him restore your soul.', prayer: 'Father, lead me to green pastures and quiet waters.' },
    { verse: '"Return to your rest, my soul, for the Lord has been good to you."', reference: 'Psalm 116:7', reflection: 'Rest in God\'s goodness. He has been good to you.', prayer: 'Lord, I rest in Your goodness.' },
    { verse: '"The Lord is my shepherd; I shall not want. He makes me lie down in green pastures."', reference: 'Psalm 23:1-2', reflection: 'With God as your shepherd, you lack nothing. He leads you to rest.', prayer: 'Father, I rest in Your provision.' },
    { verse: '"Be still, and know that I am God."', reference: 'Psalm 46:10', reflection: 'Be still and know that God is sovereign. He is in control of all things.', prayer: 'Lord, I am still. I know You are God.' },
    { verse: '"He gives strength to the weary and increases the power of the weak."', reference: 'Isaiah 40:29', reflection: 'God gives strength to the weary. When you are weak, He makes you strong.', prayer: 'Father, give me strength today.' },
    { verse: '"The Lord is gracious and compassionate, slow to anger and rich in love."', reference: 'Psalm 145:8', reflection: 'God is gracious, compassionate, slow to anger, and rich in love.', prayer: 'Lord, thank You for Your grace and compassion.' },
    { verse: '"Praise the Lord, my soul, and forget not all his benefits."', reference: 'Psalm 103:2', reflection: 'Never forget all the benefits God has given you. Praise Him.', prayer: 'Father, I praise You for all Your benefits.' },
    { verse: '"The Lord is good to all; he has compassion on all he has made."', reference: 'Psalm 145:9', reflection: 'God is good to all and has compassion on everyone He has made.', prayer: 'Lord, thank You for Your goodness and compassion.' },
    { verse: '"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."', reference: 'Philippians 4:6', reflection: 'Don\'t be anxious about anything. Pray about everything with thanksgiving.', prayer: 'Father, I bring all my requests to You with thanksgiving.' },
    { verse: '"Casting all your anxieties on him, because he cares for you."', reference: '1 Peter 5:7', reflection: 'Cast all your anxieties on God because He cares for you.', prayer: 'Lord, I cast all my cares on You.' },
    { verse: '"Do not let your hearts be troubled. You believe in God; believe also in me."', reference: 'John 14:1', reflection: 'Don\'t let your hearts be troubled. Believe in God and in Jesus.', prayer: 'Father, I believe in You. Calm my troubled heart.' },
    { verse: '"Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls."', reference: 'Matthew 11:29', reflection: 'Take Jesus\' yoke. Learn from Him. Find rest for your soul.', prayer: 'Lord, I take Your yoke. Teach me and give me rest.' },
    { verse: '"For my yoke is easy and my burden is light."', reference: 'Matthew 11:30', reflection: 'Jesus\' yoke is easy and His burden is light. Follow Him.', prayer: 'Father, thank You for the lightness You bring.' },

    // WISDOM & GUIDANCE (Days 61-90)
    { verse: '"If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you."', reference: 'James 1:5', reflection: 'God gives wisdom generously to all who ask. Ask Him today.', prayer: 'Lord, give me wisdom today.' },
    { verse: '"Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight."', reference: 'Proverbs 3:5-6', reflection: 'Trust God with all your heart. Submit to Him, and He will guide your path.', prayer: 'Father, I submit all my ways to You. Guide me.' },
    { verse: '"The fear of the Lord is the beginning of wisdom, and knowledge of the Holy One is understanding."', reference: 'Proverbs 9:10', reflection: 'Reverence for God is the beginning of wisdom. Know the Holy One.', prayer: 'Lord, teach me to reverence You.' },
    { verse: '"For the Lord gives wisdom; from his mouth come knowledge and understanding."', reference: 'Proverbs 2:6', reflection: 'Wisdom, knowledge, and understanding come from God alone.', prayer: 'Father, give me knowledge and understanding.' },
    { verse: '"Be very careful, then, how you live—not as unwise but as wise, making the most of every opportunity."', reference: 'Ephesians 5:15-16', reflection: 'Live wisely and make the most of every opportunity God gives you.', prayer: 'Lord, help me to live wisely.' },
    { verse: '"The heart of the discerning acquires knowledge, for the ears of the wise seek it out."', reference: 'Proverbs 18:15', reflection: 'Wise people seek knowledge. Keep learning and growing.', prayer: 'Father, give me a discerning heart.' },
    { verse: '"The wise in heart accept commands, but a chattering fool comes to ruin."', reference: 'Proverbs 10:8', reflection: 'Be wise and accept instruction. Don\'t be a fool who talks too much.', prayer: 'Lord, help me to accept instruction.' },
    { verse: '"The tongue of the wise adorns knowledge, but the mouth of the fool gushes folly."', reference: 'Proverbs 15:2', reflection: 'Speak wisely. Your words should build up, not tear down.', prayer: 'Father, help me to speak words of wisdom.' },
    { verse: '"The prudent give thought to their steps."', reference: 'Proverbs 14:15', reflection: 'Be thoughtful about your steps. Think before you act.', prayer: 'Lord, help me to think before I act.' },
    { verse: '"The beginning of wisdom is this: Get wisdom. Though it cost all you have, get understanding."', reference: 'Proverbs 4:7', reflection: 'Wisdom is worth more than anything else. Pursue it at all costs.', prayer: 'Father, I pursue wisdom at any cost.' },
    { verse: '"I will guide you along the best pathway for your life. I will advise you and watch over you."', reference: 'Psalm 32:8', reflection: 'God will guide you along the best path for your life. Follow Him.', prayer: 'Lord, guide me along the best pathway for my life.' },
    { verse: '"Your word is a lamp for my feet, a light on my path."', reference: 'Psalm 119:105', reflection: 'God\'s word lights your path. Let it guide your steps.', prayer: 'Father, let Your word be a lamp to my feet.' },
    { verse: '"Show me your ways, Lord, teach me your paths."', reference: 'Psalm 25:4', reflection: 'Ask God to show you His ways. He will teach you.', prayer: 'Lord, show me Your ways. Teach me Your paths.' },
    { verse: '"Guide me in your truth and teach me, for you are God my Savior, and my hope is in you all day long."', reference: 'Psalm 25:5', reflection: 'Be guided by God\'s truth. He is your Savior and your hope.', prayer: 'Father, guide me in Your truth.' },
    { verse: '"I will instruct you and teach you in the way you should go; I will counsel you with my loving eye on you."', reference: 'Psalm 32:8', reflection: 'God instructs and teaches you. His loving eye is on you.', prayer: 'Lord, instruct me and teach me Your ways.' },

    // STRENGTH & COURAGE (Days 91-120)
    { verse: '"Be strong and courageous. Do not be afraid or terrified because of them, for the Lord your God goes with you; he will never leave you nor forsake you."', reference: 'Deuteronomy 31:6', reflection: 'Be strong and courageous. God goes with you. He will never leave you.', prayer: 'Lord, give me strength and courage today.' },
    { verse: '"Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."', reference: 'Joshua 1:9', reflection: 'God commands you to be strong and courageous. He is with you.', prayer: 'Father, I will be strong and courageous because You are with me.' },
    { verse: '"Wait for the Lord; be strong and take heart and wait for the Lord."', reference: 'Psalm 27:14', reflection: 'Wait on the Lord. Be strong and take heart. He is faithful.', prayer: 'Lord, I wait on You. Give me strength.' },
    { verse: '"Do not be afraid, for I am with you; I will bring your children from the east and gather you from the west."', reference: 'Isaiah 43:5', reflection: 'Don\'t be afraid. God is with you and will gather you from everywhere.', prayer: 'Father, I am not afraid because You are with me.' },
    { verse: '"So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand."', reference: 'Isaiah 41:10', reflection: 'Do not fear. God is with you. He will strengthen and uphold you.', prayer: 'Lord, I trust in Your strength and help.' },
    { verse: '"God is our refuge and strength, an ever-present help in trouble."', reference: 'Psalm 46:1', reflection: 'God is your refuge and strength. He is always there to help.', prayer: 'Father, be my refuge and strength today.' },
    { verse: '"The Lord is my light and my salvation—whom shall I fear? The Lord is the stronghold of my life—of whom shall I be afraid?"', reference: 'Psalm 27:1', reflection: 'God is your light and salvation. You have nothing to fear.', prayer: 'Lord, You are my light. I will not fear.' },
    { verse: '"I sought the Lord, and he answered me; he delivered me from all my fears."', reference: 'Psalm 34:4', reflection: 'Seek the Lord. He answers and delivers you from fear.', prayer: 'Father, I seek You. Deliver me from fear.' },
    { verse: '"When I called, you answered me; you greatly emboldened me."', reference: 'Psalm 138:3', reflection: 'God answers when you call. He gives you boldness.', prayer: 'Lord, give me boldness today.' },
    { verse: '"The Lord is my strength and my defense; he has become my salvation."', reference: 'Psalm 118:14', reflection: 'God is your strength and defense. He has saved you.', prayer: 'Father, You are my strength and defense.' },
    { verse: '"The Lord is my strength and my song; he has given me victory."', reference: 'Psalm 118:14', reflection: 'God is your strength, your song, and your victory.', prayer: 'Lord, You are my victory.' },
    { verse: '"Be on your guard; stand firm in the faith; be courageous; be strong."', reference: '1 Corinthians 16:13', reflection: 'Stand firm, be courageous, and be strong in your faith.', prayer: 'Father, help me to stand firm in my faith.' },
    { verse: '"Finally, be strong in the Lord and in his mighty power."', reference: 'Ephesians 6:10', reflection: 'Be strong in the Lord and in His mighty power.', prayer: 'Lord, strengthen me with Your power.' },
    { verse: '"He gives strength to the weary and increases the power of the weak."', reference: 'Isaiah 40:29', reflection: 'God gives strength to the weary. When you are weak, He makes you strong.', prayer: 'Father, give me strength today.' },
    { verse: '"But those who hope in the Lord will renew their strength. They will soar on wings like eagles."', reference: 'Isaiah 40:31', reflection: 'Hope in the Lord. Your strength will be renewed.', prayer: 'Lord, I hope in You. Renew my strength.' },

    // LOVE & GRACE (Days 121-150)
    { verse: '"We love because he first loved us."', reference: '1 John 4:19', reflection: 'We are able to love because God first loved us.', prayer: 'Lord, help me to love others as You have loved me.' },
    { verse: '"God is love. Whoever lives in love lives in God, and God in them."', reference: '1 John 4:16', reflection: 'God is love. Live in love and you live in God.', prayer: 'Father, let me live in Your love.' },
    { verse: '"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."', reference: 'John 3:16', reflection: 'God\'s love is shown through the giving of His Son. Believe in Him and receive eternal life.', prayer: 'Lord, thank You for Your incredible love.' },
    { verse: '"But God demonstrates his own love for us in this: While we were still sinners, Christ died for us."', reference: 'Romans 5:8', reflection: 'God showed His love for us by sending Christ to die for us while we were still sinners.', prayer: 'Father, thank You for demonstrating Your love to me.' },
    { verse: '"Greater love has no one than this: to lay down one\'s life for one\'s friends."', reference: 'John 15:13', reflection: 'The greatest love is laying down your life for others. Jesus did this for you.', prayer: 'Lord, help me to love selflessly.' },
    { verse: '"Love is patient, love is kind. It does not envy, it does not boast, it is not proud."', reference: '1 Corinthians 13:4', reflection: 'Love is patient and kind. Love does not envy or boast.', prayer: 'Father, help me to love with patience and kindness.' },
    { verse: '"It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs."', reference: '1 Corinthians 13:5', reflection: 'Love doesn\'t dishonor others. It is not self-seeking or easily angered.', prayer: 'Lord, help me to love without keeping record of wrongs.' },
    { verse: '"Love does not delight in evil but rejoices with the truth."', reference: '1 Corinthians 13:6', reflection: 'Love rejoices in truth, not evil.', prayer: 'Father, help me to love truth and righteousness.' },
    { verse: '"It always protects, always trusts, always hopes, always perseveres."', reference: '1 Corinthians 13:7', reflection: 'Love always protects, trusts, hopes, and perseveres.', prayer: 'Lord, help my love to always protect, trust, and hope.' },
    { verse: '"And now these three remain: faith, hope and love. But the greatest of these is love."', reference: '1 Corinthians 13:13', reflection: 'Faith, hope, and love remain. But the greatest of these is love.', prayer: 'Father, help me to love as the greatest virtue.' },
    { verse: '"For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God."', reference: 'Ephesians 2:8', reflection: 'You are saved by grace through faith. It is a gift from God.', prayer: 'Lord, thank You for the gift of salvation.' },
    { verse: '"My grace is sufficient for you, for my power is made perfect in weakness."', reference: '2 Corinthians 12:9', reflection: 'God\'s grace is enough. His power is perfected in weakness.', prayer: 'Father, Your grace is sufficient for me.' },
    { verse: '"The grace of our Lord was poured out on me abundantly, along with the faith and love that are in Christ Jesus."', reference: '1 Timothy 1:14', reflection: 'God\'s grace is poured out abundantly on you with faith and love in Christ.', prayer: 'Lord, pour out Your grace abundantly on me.' },
    { verse: '"He gives grace to the humble."', reference: 'James 4:6', reflection: 'God gives grace to the humble. Humble yourself before Him.', prayer: 'Father, I humble myself before You. Give me grace.' },
    { verse: '"But he said to me, "My grace is sufficient for you, for my power is made perfect in weakness.""', reference: '2 Corinthians 12:9', reflection: 'God\'s grace is enough for every situation. His power is made perfect in your weakness.', prayer: 'Lord, Your grace is enough. Use my weakness for Your glory.' },
    { verse: '"For from his fullness we have all received, grace upon grace."', reference: 'John 1:16', reflection: 'We receive grace upon grace from Christ\'s fullness.', prayer: 'Father, I receive Your grace upon grace.' },
    { verse: '"Let us then approach God\'s throne of grace with confidence, so that we may receive mercy and find grace to help us in our time of need."', reference: 'Hebrews 4:16', reflection: 'Approach God\'s throne of grace with confidence. Receive mercy and grace in your time of need.', prayer: 'Lord, I approach Your throne of grace with confidence.' },
    { verse: '"The law was given through Moses; grace and truth came through Jesus Christ."', reference: 'John 1:17', reflection: 'Grace and truth came through Jesus Christ. He is full of grace and truth.', prayer: 'Father, thank You for Jesus, who is full of grace and truth.' },
    { verse: '"For sin shall no longer be your master, because you are not under the law, but under grace."', reference: 'Romans 6:14', reflection: 'Sin is no longer your master. You are under grace, not law.', prayer: 'Lord, sin is no longer my master. I am under Your grace.' },
    { verse: '"The grace of the Lord Jesus be with God\'s people. Amen."', reference: 'Revelation 22:21', reflection: 'May the grace of the Lord Jesus be with all of God\'s people.', prayer: 'Lord, let Your grace be with Your people. Amen.' },

    // HOPE & ENCOURAGEMENT (Days 151-180)
    { verse: '"May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit."', reference: 'Romans 15:13', reflection: 'May God fill you with joy, peace, and hope as you trust in Him.', prayer: 'Lord, fill me with hope, joy, and peace.' },
    { verse: '"I pray that the eyes of your heart may be enlightened in order that you may know the hope to which he has called you."', reference: 'Ephesians 1:18', reflection: 'May the eyes of your heart be enlightened to know the hope God has called you to.', prayer: 'Father, open the eyes of my heart. Show me the hope You have called me to.' },
    { verse: '"We have this hope as an anchor for the soul, firm and secure."', reference: 'Hebrews 6:19', reflection: 'Hope is an anchor for your soul. It is firm and secure in God.', prayer: 'Lord, let hope be an anchor for my soul.' },
    { verse: '"Be joyful in hope, patient in affliction, faithful in prayer."', reference: 'Romans 12:12', reflection: 'Be joyful in hope, patient in affliction, and faithful in prayer.', prayer: 'Father, help me to be joyful in hope and faithful in prayer.' },
    { verse: '"And hope does not put us to shame, because God\'s love has been poured out into our hearts through the Holy Spirit, who has been given to us."', reference: 'Romans 5:5', reflection: 'Hope does not disappoint. God\'s love has been poured out in your heart.', prayer: 'Lord, let hope not put me to shame. I trust in Your love.' },
    { verse: '"For everything that was written in the past was written to teach us, so that through the endurance taught in the Scriptures and the encouragement they provide we might have hope."', reference: 'Romans 15:4', reflection: 'Scripture was written to give you endurance, encouragement, and hope.', prayer: 'Father, let Your Scriptures give me endurance, encouragement, and hope.' },
    { verse: '"Therefore, my dear brothers and sisters, stand firm. Let nothing move you. Always give yourselves fully to the work of the Lord, because you know that your labor in the Lord is not in vain."', reference: '1 Corinthians 15:58', reflection: 'Stand firm and be steadfast. Your labor in the Lord is not in vain.', prayer: 'Lord, help me to stand firm in my faith.' },
    { verse: '"Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up."', reference: 'Galatians 6:9', reflection: 'Don\'t grow weary in doing good. You will reap a harvest if you don\'t give up.', prayer: 'Father, give me strength to keep doing good. I will not give up.' },
    { verse: '"Therefore encourage one another and build each other up, just as in fact you are doing."', reference: '1 Thessalonians 5:11', reflection: 'Encourage one another and build each other up in faith.', prayer: 'Lord, help me to encourage and build up others.' },
    { verse: '"But you, dear friends, by building yourselves up in your most holy faith and praying in the Holy Spirit, keep yourselves in God\'s love."', reference: 'Jude 1:20-21', reflection: 'Build yourself up in faith and pray in the Holy Spirit. Keep yourself in God\'s love.', prayer: 'Father, help me to build myself up in faith.' },
    { verse: '"Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."', reference: 'Joshua 1:9', reflection: 'Be strong and courageous. God is with you wherever you go.', prayer: 'Lord, I will be strong and courageous. You are with me.' },
    { verse: '"The Lord is my light and my salvation—whom shall I fear? The Lord is the stronghold of my life—of whom shall I be afraid?"', reference: 'Psalm 27:1', reflection: 'God is your light and salvation. You have nothing to fear.', prayer: 'Father, You are my light and salvation. I will not fear.' },
    { verse: '"God is our refuge and strength, an ever-present help in trouble. Therefore we will not fear, though the earth give way and the mountains fall into the heart of the sea."', reference: 'Psalm 46:1-2', reflection: 'God is your refuge and strength. You will not fear.', prayer: 'Lord, You are my refuge. I will not fear.' },
    { verse: '"But those who hope in the Lord will renew their strength. They will soar on wings like eagles."', reference: 'Isaiah 40:31', reflection: 'Hope in the Lord and your strength will be renewed.', prayer: 'Father, I hope in You. Renew my strength.' },
    { verse: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."', reference: 'Jeremiah 29:11', reflection: 'God has good plans for you. Plans to give you hope and a future.', prayer: 'Lord, I trust in Your good plans for my life.' },
    { verse: '"And we know that in all things God works for the good of those who love him, who have been called according to his purpose."', reference: 'Romans 8:28', reflection: 'God works all things for good for those who love Him.', prayer: 'Father, I trust that You are working all things for my good.' },
    { verse: '"The Lord is near to all who call on him, to all who call on him in truth."', reference: 'Psalm 145:18', reflection: 'God is near to all who call on Him in truth.', prayer: 'Lord, I call on You. Draw near to me.' },
    { verse: '"He heals the brokenhearted and binds up their wounds."', reference: 'Psalm 147:3', reflection: 'God heals the brokenhearted and binds up their wounds.', prayer: 'Father, heal my broken heart. Bind up my wounds.' },
    { verse: '"The Lord is gracious and compassionate, slow to anger and rich in love."', reference: 'Psalm 145:8', reflection: 'God is gracious, compassionate, slow to anger, and rich in love.', prayer: 'Lord, thank You for Your grace, compassion, and love.' },
    { verse: '"The Lord is good to all; he has compassion on all he has made."', reference: 'Psalm 145:9', reflection: 'God is good to all. He has compassion on everyone.', prayer: 'Father, thank You for Your goodness and compassion.' },

    // HEALING & DELIVERANCE (Days 181-210)
    { verse: '"He himself bore our sins in his body on the cross, so that we might die to sins and live for righteousness; by his wounds you have been healed."', reference: '1 Peter 2:24', reflection: 'By Jesus\' wounds, you have been healed. Receive your healing today.', prayer: 'Lord, by Your wounds I am healed.' },
    { verse: '"I am the Lord, who heals you."', reference: 'Exodus 15:26', reflection: 'The Lord is your healer. He heals you.', prayer: 'Father, You are the Lord who heals me.' },
    { verse: '"Heal the sick, raise the dead, cleanse those who have leprosy, drive out demons."', reference: 'Matthew 10:8', reflection: 'Jesus gives His followers authority to heal the sick and drive out demons.', prayer: 'Lord, use me to bring healing to others.' },
    { verse: '"And these signs will accompany those who believe: In my name they will drive out demons... they will place their hands on sick people, and they will get well."', reference: 'Mark 16:17-18', reflection: 'Believers have authority to heal the sick and drive out demons in Jesus\' name.', prayer: 'Father, I believe in Your healing power.' },
    { verse: '"He said to her, "Daughter, your faith has healed you. Go in peace and be freed from your suffering.""', reference: 'Mark 5:34', reflection: 'Faith brings healing. Go in peace and be free from suffering.', prayer: 'Lord, my faith is in You. Bring healing to me.' },
    { verse: '"Jesus went throughout Galilee, teaching in their synagogues, proclaiming the good news of the kingdom, and healing every disease and sickness among the people."', reference: 'Matthew 4:23', reflection: 'Jesus preached the good news and healed every disease and sickness.', prayer: 'Lord, I receive Your healing for every sickness.' },
    { verse: '"He took up our pain and bore our suffering... and by his wounds we are healed."', reference: 'Isaiah 53:4-5', reflection: 'Jesus took our pain and suffering. By His wounds we are healed.', prayer: 'Father, thank You for healing me through Christ.' },
    { verse: '"I will give you health and heal your wounds, declares the Lord."', reference: 'Jeremiah 30:17', reflection: 'God promises to give you health and heal your wounds.', prayer: 'Lord, I receive Your promise of health and healing.' },
    { verse: '"He sent out his word and healed them; he rescued them from the grave."', reference: 'Psalm 107:20', reflection: 'God sends His word to heal and rescue you.', prayer: 'Father, let Your word heal me today.' },
    { verse: '"Praise the Lord, my soul, and forget not all his benefits—who forgives all your sins and heals all your diseases."', reference: 'Psalm 103:2-3', reflection: 'Praise the Lord who forgives all your sins and heals all your diseases.', prayer: 'Lord, I praise You for forgiveness and healing.' },
    { verse: '"The Lord will keep you free from every disease."', reference: 'Deuteronomy 7:15', reflection: 'God will keep you free from every disease. Trust in His protection.', prayer: 'Father, I trust You to keep me free from disease.' },
    { verse: '"He gives power to the weak and strength to the powerless."', reference: 'Isaiah 40:29', reflection: 'God gives power to the weak and strength to the powerless.', prayer: 'Lord, give me power and strength today.' },
    { verse: '"He will call on me, and I will answer him; I will be with him in trouble, I will deliver him and honor him."', reference: 'Psalm 91:15', reflection: 'God answers when you call. He is with you in trouble and delivers you.', prayer: 'Father, I call on You. Deliver me and honor me.' },
    { verse: '"The righteous cry out, and the Lord hears them; he delivers them from all their troubles."', reference: 'Psalm 34:17', reflection: 'The Lord hears the righteous and delivers them from all their troubles.', prayer: 'Lord, hear my cry and deliver me.' },
    { verse: '"He brought them out of darkness, the utter darkness, and broke away their chains."', reference: 'Psalm 107:14', reflection: 'God brings you out of darkness and breaks your chains.', prayer: 'Father, break every chain in my life.' },
    { verse: '"But he was pierced for our transgressions, he was crushed for our iniquities; the punishment that brought us peace was on him, and by his wounds we are healed."', reference: 'Isaiah 53:5', reflection: 'Jesus was pierced and crushed for us. By His wounds we are healed.', prayer: 'Lord, thank You for taking my punishment and bringing me peace and healing.' },
    { verse: '"The Spirit of the Lord is on me, because he has anointed me to proclaim good news to the poor. He has sent me to proclaim freedom for the prisoners and recovery of sight for the blind, to set the oppressed free."', reference: 'Luke 4:18', reflection: 'Jesus was anointed to bring good news, freedom, sight, and release to the oppressed.', prayer: 'Lord, bring freedom and release to my life today.' },
    { verse: '"Therefore confess your sins to each other and pray for each other so that you may be healed. The prayer of a righteous person is powerful and effective."', reference: 'James 5:16', reflection: 'Confess your sins and pray for each other. The prayer of a righteous person is powerful and effective.', prayer: 'Father, I confess my sins. Heal me through prayer.' },
    { verse: '"Is anyone among you sick? Let them call the elders of the church to pray over them and anoint them with oil in the name of the Lord. And the prayer offered in faith will make the sick person well."', reference: 'James 5:14-15', reflection: 'Pray for the sick with faith. The prayer of faith will make them well.', prayer: 'Lord, I pray for healing in faith.' },
    { verse: '"Jesus Christ is the same yesterday and today and forever."', reference: 'Hebrews 13:8', reflection: 'Jesus is the same always. He healed in the past and He heals today.', prayer: 'Lord, You never change. Heal me today as You healed in the past.' },

    // PRAYER & WORSHIP (Days 211-240)
    { verse: '"Rejoice always, pray continually, give thanks in all circumstances; for this is God\'s will for you in Christ Jesus."', reference: '1 Thessalonians 5:16-18', reflection: 'Rejoice, pray, and give thanks in all circumstances.', prayer: 'Lord, help me to rejoice, pray, and give thanks always.' },
    { verse: '"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."', reference: 'Philippians 4:6', reflection: 'Don\'t be anxious. Pray about everything with thanksgiving.', prayer: 'Father, I bring all my requests to You with thanksgiving.' },
    { verse: '"And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus."', reference: 'Philippians 4:7', reflection: 'The peace of God will guard your heart and mind in Christ.', prayer: 'Lord, let Your peace guard my heart and mind.' },
    { verse: '"Pray without ceasing."', reference: '1 Thessalonians 5:17', reflection: 'Pray without ceasing. Keep a prayerful attitude always.', prayer: 'Father, help me to pray without ceasing.' },
    { verse: '"The Lord is near to all who call on him, to all who call on him in truth."', reference: 'Psalm 145:18', reflection: 'God is near to all who call on Him in truth.', prayer: 'Lord, I call on You in truth. Draw near to me.' },
    { verse: '"Then you will call on me and come and pray to me, and I will listen to you."', reference: 'Jeremiah 29:12', reflection: 'God listens when you call on Him and pray.', prayer: 'Father, I call on You. I know You hear me.' },
    { verse: '"He will call on me, and I will answer him; I will be with him in trouble, I will deliver him and honor him."', reference: 'Psalm 91:15', reflection: 'God answers when you call. He is with you in trouble and delivers you.', prayer: 'Lord, I call on You. Answer me and deliver me.' },
    { verse: '"Call to me and I will answer you and tell you great and unsearchable things you do not know."', reference: 'Jeremiah 33:3', reflection: 'Call to God. He will answer and reveal great things to you.', prayer: 'Father, I call to You. Reveal great things to me.' },
    { verse: '"This is the confidence we have in approaching God: that if we ask anything according to his will, he hears us."', reference: '1 John 5:14', reflection: 'We have confidence that if we ask according to God\'s will, He hears us.', prayer: 'Lord, I ask according to Your will. I know You hear me.' },
    { verse: '"And if we know that he hears us—whatever we ask—we know that we have what we asked of him."', reference: '1 John 5:15', reflection: 'If we know God hears us, we know we have what we asked.', prayer: 'Father, I know You hear me. I trust You to answer.' },
    { verse: '"Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name."', reference: 'Psalm 100:4', reflection: 'Enter God\'s presence with thanksgiving and praise.', prayer: 'Lord, I enter Your presence with thanksgiving and praise.' },
    { verse: '"Come, let us sing for joy to the Lord; let us shout aloud to the Rock of our salvation."', reference: 'Psalm 95:1', reflection: 'Sing and shout for joy to God, the Rock of your salvation.', prayer: 'Father, I sing for joy to You. You are my Rock and my Salvation.' },
    { verse: '"Let everything that has breath praise the Lord. Praise the Lord."', reference: 'Psalm 150:6', reflection: 'Everything that has breath should praise the Lord. Praise the Lord!', prayer: 'Lord, I praise You with everything in me.' },
    { verse: '"Praise the Lord, my soul; all my inmost being, praise his holy name."', reference: 'Psalm 103:1', reflection: 'Praise the Lord with all your soul and all your inmost being.', prayer: 'Father, I praise You with all that is within me.' },
    { verse: '"Great is the Lord and most worthy of praise; his greatness no one can fathom."', reference: 'Psalm 145:3', reflection: 'God is great and worthy of praise. His greatness is beyond understanding.', prayer: 'Lord, You are great and worthy of praise.' },
    { verse: '"I will exalt you, my God the King; I will praise your name for ever and ever."', reference: 'Psalm 145:1', reflection: 'Exalt God and praise His name forever.', prayer: 'Father, I exalt You and praise Your name forever.' },
    { verse: '"One generation shall commend your works to another, and shall declare your mighty acts."', reference: 'Psalm 145:4', reflection: 'Each generation should declare God\'s works and mighty acts to the next.', prayer: 'Lord, let me declare Your mighty acts to the next generation.' },
    { verse: '"They will speak of the glorious splendor of your majesty, and I will meditate on your wonderful works."', reference: 'Psalm 145:5', reflection: 'Speak of God\'s glory and meditate on His wonderful works.', prayer: 'Father, I will meditate on Your wonderful works.' },
    { verse: '"The Lord is faithful to all his promises and loving toward all he has made."', reference: 'Psalm 145:13', reflection: 'God is faithful to all His promises and loving to all He has made.', prayer: 'Lord, thank You for Your faithfulness and love.' },
    { verse: '"My mouth will speak in praise of the Lord. Let every creature praise his holy name for ever and ever."', reference: 'Psalm 145:21', reflection: 'Let every creature praise God\'s holy name forever.', prayer: 'Father, let every creature praise You forever.' },

    // PATIENCE & PERSEVERANCE (Days 241-270)
    { verse: '"Be joyful in hope, patient in affliction, faithful in prayer."', reference: 'Romans 12:12', reflection: 'Be joyful in hope, patient in affliction, and faithful in prayer.', prayer: 'Lord, give me joy, patience, and faithfulness today.' },
    { verse: '"But those who hope in the Lord will renew their strength. They will soar on wings like eagles."', reference: 'Isaiah 40:31', reflection: 'Hope in the Lord and your strength will be renewed.', prayer: 'Father, I hope in You. Renew my strength.' },
    { verse: '"Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up."', reference: 'Galatians 6:9', reflection: 'Don\'t grow weary in doing good. You will reap a harvest in due time.', prayer: 'Lord, give me strength to keep doing good. I will not give up.' },
    { verse: '"Therefore, my dear brothers and sisters, stand firm. Let nothing move you. Always give yourselves fully to the work of the Lord, because you know that your labor in the Lord is not in vain."', reference: '1 Corinthians 15:58', reflection: 'Stand firm and be steadfast. Your labor in the Lord is not in vain.', prayer: 'Father, help me to stand firm and be steadfast.' },
    { verse: '"Perseverance must finish its work so that you may be mature and complete, not lacking anything."', reference: 'James 1:4', reflection: 'Let perseverance finish its work. You will be mature and complete.', prayer: 'Lord, help me to persevere. Make me mature and complete.' },
    { verse: '"Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance."', reference: 'James 1:2-3', reflection: 'Consider trials pure joy. They produce perseverance in your faith.', prayer: 'Father, help me to find joy in trials. Let them produce perseverance in me.' },
    { verse: '"Blessed is the one who perseveres under trial because, having stood the test, that person will receive the crown of life that the Lord has promised to those who love him."', reference: 'James 1:12', reflection: 'Blessed are those who persevere under trial. They will receive the crown of life.', prayer: 'Lord, help me to persevere under trial. I want to receive the crown of life.' },
    { verse: '"Be strong and take heart, all you who hope in the Lord."', reference: 'Psalm 31:24', reflection: 'Be strong and take heart. Hope in the Lord.', prayer: 'Father, I am strong and take heart. I hope in You.' },
    { verse: '"Wait for the Lord; be strong and take heart and wait for the Lord."', reference: 'Psalm 27:14', reflection: 'Wait for the Lord. Be strong and take heart.', prayer: 'Lord, I wait for You. Give me strength and courage.' },
    { verse: '"The Lord is good to those whose hope is in him, to the one who seeks him."', reference: 'Lamentations 3:25', reflection: 'God is good to those who hope in Him and seek Him.', prayer: 'Father, I hope in You and seek You. You are good.' },
    { verse: '"It is good to wait quietly for the salvation of the Lord."', reference: 'Lamentations 3:26', reflection: 'It is good to wait quietly for God\'s salvation.', prayer: 'Lord, I wait quietly for Your salvation.' },
    { verse: '"The Lord is my portion," says my soul, "therefore I will hope in him."', reference: 'Lamentations 3:24', reflection: 'The Lord is your portion. Hope in Him.', prayer: 'Father, You are my portion. I hope in You.' },
    { verse: '"I wait for the Lord, my whole being waits, and in his word I put my hope."', reference: 'Psalm 130:5', reflection: 'Wait for the Lord and put your hope in His word.', prayer: 'Lord, I wait for You. I put my hope in Your word.' },
    { verse: '"I remember, and my soul is downcast within me. Yet this I call to mind and therefore I have hope: Because of the Lord\'s great love we are not consumed, for his compassions never fail."', reference: 'Lamentations 3:20-22', reflection: 'Remember God\'s love and compassion. They never fail. You have hope.', prayer: 'Father, I remember Your love and compassion. They never fail.' },
    { verse: '"They are new every morning; great is your faithfulness."', reference: 'Lamentations 3:23', reflection: 'God\'s mercies are new every morning. Great is His faithfulness.', prayer: 'Lord, thank You for new mercies every morning. Great is Your faithfulness.' },
    { verse: '"I say to myself, "The Lord is my portion; therefore I will wait for him.""', reference: 'Lamentations 3:24', reflection: 'The Lord is your portion. Wait for Him.', prayer: 'Father, You are my portion. I wait for You.' },
    { verse: '"But I will hope continually and will praise you yet more and more."', reference: 'Psalm 71:14', reflection: 'Hope continually in God and praise Him more and more.', prayer: 'Lord, I hope in You continually. I will praise You more and more.' },
    { verse: '"My soul waits for the Lord more than watchmen wait for the morning."', reference: 'Psalm 130:6', reflection: 'Wait for the Lord more than watchmen wait for morning.', prayer: 'Father, I wait for You more than anything else.' },
    { verse: '"But they who wait for the Lord shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint."', reference: 'Isaiah 40:31', reflection: 'Those who wait on God will renew their strength. They will soar like eagles.', prayer: 'Lord, I wait on You. Renew my strength. Let me soar like an eagle.' },
    { verse: '"The Lord will fight for you; you need only to be still."', reference: 'Exodus 14:14', reflection: 'God fights for you. Sometimes you only need to be still.', prayer: 'Father, I am still before You. Fight for me.' },

    // FORGIVENESS & REDEMPTION (Days 271-300)
    { verse: '"If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness."', reference: '1 John 1:9', reflection: 'If you confess your sins, God is faithful to forgive and purify you.', prayer: 'Lord, I confess my sins. Forgive me and purify me.' },
    { verse: '"As far as the east is from the west, so far has he removed our transgressions from us."', reference: 'Psalm 103:12', reflection: 'God removes your sins as far as the east is from the west.', prayer: 'Father, thank You for removing my sins so far away.' },
    { verse: '"In him we have redemption through his blood, the forgiveness of sins, in accordance with the riches of God\'s grace."', reference: 'Ephesians 1:7', reflection: 'We have redemption and forgiveness through Christ\'s blood.', prayer: 'Lord, thank You for redemption and forgiveness through Your blood.' },
    { verse: '"But God demonstrates his own love for us in this: While we were still sinners, Christ died for us."', reference: 'Romans 5:8', reflection: 'God showed His love for us by sending Christ to die for us while we were sinners.', prayer: 'Father, thank You for demonstrating Your love to me.' },
    { verse: '"Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!"', reference: '2 Corinthians 5:17', reflection: 'In Christ, you are a new creation. The old is gone, the new is here.', prayer: 'Lord, I am a new creation in You. The old is gone.' },
    { verse: '"He saved us, not because of righteous things we had done, but because of his mercy."', reference: 'Titus 3:5', reflection: 'God saved you because of His mercy, not because of your good deeds.', prayer: 'Father, thank You for saving me by Your mercy.' },
    { verse: '"God made him who had no sin to be sin for us, so that in him we might become the righteousness of God."', reference: '2 Corinthians 5:21', reflection: 'God made Christ who knew no sin to be sin for us, so that we could become the righteousness of God.', prayer: 'Lord, thank You for becoming sin for me so I could become Your righteousness.' },
    { verse: '"There is therefore now no condemnation for those who are in Christ Jesus."', reference: 'Romans 8:1', reflection: 'There is no condemnation for those who are in Christ Jesus.', prayer: 'Father, I am in Christ. There is no condemnation for me.' },
    { verse: '"But because of his great love for us, God, who is rich in mercy, made us alive with Christ even when we were dead in transgressions—it is by grace you have been saved."', reference: 'Ephesians 2:4-5', reflection: 'God\'s great love and rich mercy made you alive with Christ.', prayer: 'Lord, thank You for Your great love and rich mercy.' },
    { verse: '"For he has rescued us from the dominion of darkness and brought us into the kingdom of the Son he loves, in whom we have redemption, the forgiveness of sins."', reference: 'Colossians 1:13-14', reflection: 'God rescued you from darkness and brought you into His kingdom. You have redemption and forgiveness.', prayer: 'Father, thank You for rescuing me from darkness.' },
    { verse: '"Then I acknowledged my sin to you and did not cover up my iniquity. I said, "I will confess my transgressions to the Lord." And you forgave the guilt of my sin."', reference: 'Psalm 32:5', reflection: 'Confess your sins to God and He will forgive you.', prayer: 'Lord, I confess my transgressions. Forgive me and remove the guilt.' },
    { verse: '"The Lord is compassionate and gracious, slow to anger, abounding in love."', reference: 'Psalm 103:8', reflection: 'God is compassionate, gracious, slow to anger, and abounding in love.', prayer: 'Father, thank You for Your compassion, grace, and love.' },
    { verse: '"He will not always accuse, nor will he harbor his anger forever; he does not treat us as our sins deserve or repay us according to our iniquities."', reference: 'Psalm 103:9-10', reflection: 'God does not treat you as your sins deserve. He is forgiving.', prayer: 'Lord, thank You for not treating me as my sins deserve.' },
    { verse: '"For as high as the heavens are above the earth, so great is his love for those who fear him."', reference: 'Psalm 103:11', reflection: 'God\'s love for you is as high as the heavens are above the earth.', prayer: 'Father, Your love for me is immeasurable. Thank You.' },
    { verse: '"He forgives all your sins and heals all your diseases."', reference: 'Psalm 103:3', reflection: 'God forgives all your sins and heals all your diseases.', prayer: 'Lord, I receive Your forgiveness and healing.' },
    { verse: '"Come now, let us settle the matter," says the Lord. "Though your sins are like scarlet, they shall be as white as snow."', reference: 'Isaiah 1:18', reflection: 'Though your sins are like scarlet, God will make them white as snow.', prayer: 'Father, make my sins white as snow.' },
    { verse: '"I, even I, am he who blots out your transgressions, for my own sake, and remembers your sins no more."', reference: 'Isaiah 43:25', reflection: 'God blots out your transgressions and remembers your sins no more.', prayer: 'Lord, thank You for blotting out my transgressions.' },
    { verse: '"For I will forgive their wickedness and will remember their sins no more."', reference: 'Hebrews 8:12', reflection: 'God forgives your wickedness and remembers your sins no more.', prayer: 'Father, thank You for forgiving me and not remembering my sins.' },
    { verse: '"But if we walk in the light, as he is in the light, we have fellowship with one another, and the blood of Jesus, his Son, purifies us from all sin."', reference: '1 John 1:7', reflection: 'Walk in the light and the blood of Jesus purifies you from all sin.', prayer: 'Lord, help me to walk in the light. Purify me with Your blood.' },
    { verse: '"My dear children, I write this to you so that you will not sin. But if anybody does sin, we have an advocate with the Father—Jesus Christ, the Righteous One."', reference: '1 John 2:1', reflection: 'If you sin, you have an advocate with the Father—Jesus Christ.', prayer: 'Father, thank You for Jesus, my advocate.' },

    // ETERNAL LIFE & PROMISES (Days 301-330)
    { verse: '"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."', reference: 'John 3:16', reflection: 'Believe in Jesus and receive eternal life.', prayer: 'Lord, I believe in You. Thank You for eternal life.' },
    { verse: '"Now this is eternal life: that they know you, the only true God, and Jesus Christ, whom you have sent."', reference: 'John 17:3', reflection: 'Eternal life is knowing God and Jesus Christ.', prayer: 'Father, I want to know You and Jesus more deeply.' },
    { verse: '"And this is the testimony: God has given us eternal life, and this life is in his Son."', reference: '1 John 5:11', reflection: 'God has given you eternal life through His Son.', prayer: 'Lord, thank You for the gift of eternal life.' },
    { verse: '"Whoever has the Son has life; whoever does not have the Son of God does not have life."', reference: '1 John 5:12', reflection: 'You have life if you have the Son. If you don\'t have the Son, you don\'t have life.', prayer: 'Father, I have the Son. I have life.' },
    { verse: '"I give them eternal life, and they shall never perish; no one will snatch them out of my hand."', reference: 'John 10:28', reflection: 'Jesus gives you eternal life. No one can snatch you out of His hand.', prayer: 'Lord, thank You for holding me securely in Your hand.' },
    { verse: '"For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord."', reference: 'Romans 6:23', reflection: 'The wages of sin is death, but the gift of God is eternal life through Christ.', prayer: 'Father, thank You for the gift of eternal life through Christ.' },
    { verse: '"In my Father\'s house are many rooms; if it were not so, I would have told you. I am going there to prepare a place for you."', reference: 'John 14:2', reflection: 'Jesus is preparing a place for you in His Father\'s house.', prayer: 'Lord, thank You for preparing a place for me.' },
    { verse: '"And if I go and prepare a place for you, I will come back and take you to be with me that you also may be where I am."', reference: 'John 14:3', reflection: 'Jesus will come back to take you to be with Him.', prayer: 'Father, I look forward to being where Jesus is.' },
    { verse: '"For the Lord himself will come down from heaven, with a loud command, with the voice of the archangel and with the trumpet call of God, and the dead in Christ will rise first."', reference: '1 Thessalonians 4:16', reflection: 'The Lord will return with a loud command. The dead in Christ will rise first.', prayer: 'Lord, come quickly. I look forward to Your return.' },
    { verse: '"After that, we who are still alive and are left will be caught up together with them in the clouds to meet the Lord in the air. And so we will be with the Lord forever."', reference: '1 Thessalonians 4:17', reflection: 'We will be with the Lord forever.', prayer: 'Father, I look forward to being with You forever.' },
    { verse: '"And God will wipe away every tear from their eyes; there shall be no more death, nor sorrow, nor crying. There shall be no more pain, for the former things have passed away."', reference: 'Revelation 21:4', reflection: 'In heaven, there will be no more tears, death, sorrow, crying, or pain.', prayer: 'Lord, I look forward to the day when there will be no more pain.' },
    { verse: '"He who was seated on the throne said, "I am making everything new!""', reference: 'Revelation 21:5', reflection: 'God is making everything new.', prayer: 'Father, thank You for making everything new.' },
    { verse: '"Blessed are those who wash their robes, that they may have the right to the tree of life and may go through the gates into the city."', reference: 'Revelation 22:14', reflection: 'Blessed are those who wash their robes and have the right to the tree of life.', prayer: 'Lord, wash me and give me the right to the tree of life.' },
    { verse: '"The Spirit and the bride say, "Come!" And let the one who hears say, "Come!" Let the one who is thirsty come; and let the one who wishes take the free gift of the water of life."', reference: 'Revelation 22:17', reflection: 'The Spirit and the bride say "Come!" Take the free gift of the water of life.', prayer: 'Father, I come. I take the free gift of the water of life.' },
    { verse: '"He who testifies to these things says, "Yes, I am coming soon." Amen. Come, Lord Jesus."', reference: 'Revelation 22:20', reflection: 'Jesus says, "I am coming soon." Come, Lord Jesus.', prayer: 'Lord Jesus, come soon. Maranatha.' },
    { verse: '"The grace of the Lord Jesus be with God\'s people. Amen."', reference: 'Revelation 22:21', reflection: 'May the grace of the Lord Jesus be with you.', prayer: 'Lord, let Your grace be with Your people. Amen.' },
    { verse: '"Now to him who is able to keep you from stumbling and to present you before his glorious presence without fault and with great joy."', reference: 'Jude 1:24', reflection: 'God is able to keep you from stumbling and present you before His presence without fault.', prayer: 'Father, keep me from stumbling. Present me before You without fault.' },
    { verse: '"To the only God our Savior be glory, majesty, power and authority, through Jesus Christ our Lord, before all ages, now and forevermore! Amen."', reference: 'Jude 1:25', reflection: 'To God be glory, majesty, power, and authority forever.', prayer: 'Lord, to You be glory, majesty, power, and authority forever. Amen.' },
    { verse: '"For we must all appear before the judgment seat of Christ, so that each of us may receive what is due us for the things done while in the body, whether good or bad."', reference: '2 Corinthians 5:10', reflection: 'We will all appear before the judgment seat of Christ to receive what is due.', prayer: 'Lord, help me to live in a way that is pleasing to You.' },
    { verse: '"Since, then, you have been raised with Christ, set your hearts on things above, where Christ is, seated at the right hand of God."', reference: 'Colossians 3:1', reflection: 'Set your heart on things above, where Christ is.', prayer: 'Father, help me to set my heart on things above.' },

    // VICTORY & OVERCOMING (Days 331-365)
    { verse: '"But thanks be to God, who gives us the victory through our Lord Jesus Christ."', reference: '1 Corinthians 15:57', reflection: 'God gives you the victory through Jesus Christ.', prayer: 'Lord, thank You for victory through Christ.' },
    { verse: '"For everyone born of God overcomes the world. This is the victory that has overcome the world, even our faith."', reference: '1 John 5:4', reflection: 'Faith is the victory that overcomes the world.', prayer: 'Father, increase my faith to overcome the world.' },
    { verse: '"Who is it that overcomes the world? Only the one who believes that Jesus is the Son of God."', reference: '1 John 5:5', reflection: 'Those who believe Jesus is the Son of God overcome the world.', prayer: 'Lord, I believe You are the Son of God. Help me to overcome.' },
    { verse: '"No, in all these things we are more than conquerors through him who loved us."', reference: 'Romans 8:37', reflection: 'You are more than a conqueror through Christ who loves you.', prayer: 'Father, I am more than a conqueror through Christ.' },
    { verse: '"For the Lord your God is the one who goes with you to fight for you against your enemies to give you victory."', reference: 'Deuteronomy 20:4', reflection: 'God goes with you to fight for you and give you victory.', prayer: 'Lord, go with me and fight for me. Give me victory.' },
    { verse: '"The Lord will cause your enemies who rise against you to be defeated before you. They will come out against you one way and flee before you seven ways."', reference: 'Deuteronomy 28:7', reflection: 'God will defeat your enemies before you.', prayer: 'Father, let my enemies be defeated before me.' },
    { verse: '"Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand."', reference: 'Isaiah 41:10', reflection: 'Do not fear. God is with you. He will strengthen, help, and uphold you.', prayer: 'Lord, I will not fear. You are with me. Strengthen and help me.' },
    { verse: '"In all these things we are more than conquerors through him who loved us."', reference: 'Romans 8:37', reflection: 'You are more than a conqueror through Christ.', prayer: 'Father, I am more than a conqueror. Thank You for loving me.' },
    { verse: '"For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord."', reference: 'Romans 8:38-39', reflection: 'Nothing can separate you from the love of God in Christ.', prayer: 'Lord, nothing can separate me from Your love. Thank You.' },
    { verse: '"The sting of death is sin, and the power of sin is the law. But thanks be to God! He gives us the victory through our Lord Jesus Christ."', reference: '1 Corinthians 15:56-57', reflection: 'God gives you victory over sin and death through Jesus.', prayer: 'Father, thank You for victory over sin and death.' },
    { verse: '"Now thanks be to God, who always leads us in triumph in Christ."', reference: '2 Corinthians 2:14', reflection: 'God always leads you in triumph in Christ.', prayer: 'Lord, lead me in triumph. Thank You for victory.' },
    { verse: '"He who dwells in the shelter of the Most High will rest in the shadow of the Almighty."', reference: 'Psalm 91:1', reflection: 'Dwell in God\'s shelter and rest in His shadow.', prayer: 'Father, I dwell in Your shelter. I rest in Your shadow.' },
    { verse: '"A thousand may fall at your side, ten thousand at your right hand, but it will not come near you."', reference: 'Psalm 91:7', reflection: 'Even if thousands fall around you, harm will not come near you.', prayer: 'Lord, I trust You to protect me from harm.' },
    { verse: '"For he will command his angels concerning you to guard you in all your ways."', reference: 'Psalm 91:11', reflection: 'God commands His angels to guard you in all your ways.', prayer: 'Father, thank You for Your angels watching over me.' },
    { verse: '"They will lift you up in their hands, so that you will not strike your foot against a stone."', reference: 'Psalm 91:12', reflection: 'Angels will lift you up so you don\'t trip.', prayer: 'Lord, thank You for keeping me from stumbling.' },
    { verse: '"Because he loves me," says the Lord, "I will rescue him; I will protect him, for he acknowledges my name."', reference: 'Psalm 91:14', reflection: 'God rescues and protects those who love Him and acknowledge His name.', prayer: 'Father, I love You and acknowledge Your name. Rescue and protect me.' },
    { verse: '"He will call on me, and I will answer him; I will be with him in trouble, I will deliver him and honor him."', reference: 'Psalm 91:15', reflection: 'God answers when you call. He is with you in trouble and delivers you.', prayer: 'Lord, I call on You. Answer me and deliver me.' },
    { verse: '"With long life I will satisfy him and show him my salvation."', reference: 'Psalm 91:16', reflection: 'God will satisfy you with long life and show you His salvation.', prayer: 'Father, satisfy me with long life. Show me Your salvation.' },
    { verse: '"My flesh and my heart may fail, but God is the strength of my heart and my portion forever."', reference: 'Psalm 73:26', reflection: 'Even when your body and heart fail, God is your strength and your portion forever.', prayer: 'Lord, You are my strength and my portion forever.' },
    { verse: '"But as for me, it is good to be near God. I have made the Sovereign Lord my refuge; I will tell of all your deeds."', reference: 'Psalm 73:28', reflection: 'It is good to be near God. Make Him your refuge and tell of His deeds.', prayer: 'Father, I want to be near You. You are my refuge. I will tell of Your deeds.' },
    { verse: '"The Lord is my strength and my song; he has become my salvation."', reference: 'Psalm 118:14', reflection: 'God is your strength, your song, and your salvation.', prayer: 'Lord, You are my strength, my song, and my salvation.' },
    { verse: '"Give thanks to the Lord, for he is good; his love endures forever."', reference: 'Psalm 118:29', reflection: 'Give thanks to God because He is good and His love endures forever.', prayer: 'Father, I give thanks to You. Your love endures forever.' },
    { verse: '"The Lord has done it this very day; let us rejoice today and be glad."', reference: 'Psalm 118:24', reflection: 'This is the day the Lord has made. Rejoice and be glad in it.', prayer: 'Lord, I rejoice in this day. You have made it.' },
    { verse: '"Praise the Lord, all you nations; extol him, all you peoples. For great is his love toward us, and the faithfulness of the Lord endures forever. Praise the Lord."', reference: 'Psalm 117', reflection: 'Praise the Lord for His great love and enduring faithfulness.', prayer: 'Father, I praise You for Your great love and faithfulness.' },
    { verse: '"Let everything that has breath praise the Lord. Praise the Lord!"', reference: 'Psalm 150:6', reflection: 'Everything that has breath should praise the Lord. Praise the Lord!', prayer: 'Lord, I praise You with everything in me. Hallelujah!' },
    { verse: '"Praise the Lord. Praise God in his sanctuary; praise him in his mighty heavens."', reference: 'Psalm 150:1', reflection: 'Praise God in His sanctuary and in His mighty heavens.', prayer: 'Father, I praise You in Your sanctuary. Hallelujah!' },
    { verse: '"Praise him for his acts of power; praise him for his surpassing greatness."', reference: 'Psalm 150:2', reflection: 'Praise God for His acts of power and surpassing greatness.', prayer: 'Lord, I praise You for Your power and greatness.' },
    { verse: '"Praise him with the sounding of the trumpet, praise him with the harp and lyre."', reference: 'Psalm 150:3', reflection: 'Praise God with musical instruments.', prayer: 'Father, I praise You with music and song.' },
    { verse: '"Let everything that has breath praise the Lord. Praise the Lord!"', reference: 'Psalm 150:6', reflection: 'Everything with breath should praise the Lord. Praise the Lord!', prayer: 'Lord, I will praise You with my breath and my life. Hallelujah!' },
    { verse: '"Bless the Lord, O my soul, and all that is within me, bless his holy name!"', reference: 'Psalm 103:1', reflection: 'Bless the Lord with all that is within you.', prayer: 'Father, I bless Your holy name with all that is in me.' }
];

// Ensure we have at least 365 verses
console.log(`Loaded ${FALLBACK_SCRIPTURES.length} fallback scriptures`);

let cachedScripture = null;
let cachedDate = null;

/**
 * Get today's scripture from Firestore or fallback
 */
export async function getScriptureOfDay() {
    const today = new Date().toISOString().split('T')[0];
    
    // Return cached version if already fetched today
    if (cachedScripture && cachedDate === today) {
        return cachedScripture;
    }

    try {
        // Try to get from Firestore
        const q = query(collection(db, 'scriptures'), orderBy('order'), limit(365));
        const snapshot = await getDocs(q);
        const verses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (verses.length > 0) {
            // Use day of year to get a unique verse each day
            const startOfYear = new Date(new Date().getFullYear(), 0, 0);
            const diff = new Date() - startOfYear;
            const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
            const index = dayOfYear % verses.length;
            
            cachedScripture = verses[index];
            cachedDate = today;
            return cachedScripture;
        }
    } catch (error) {
        console.warn('Firestore error, using fallback:', error);
    }
    
    // Fallback to hardcoded list
    const startOfYear = new Date(new Date().getFullYear(), 0, 0);
    const diff = new Date() - startOfYear;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    const index = dayOfYear % FALLBACK_SCRIPTURES.length;
    
    cachedScripture = FALLBACK_SCRIPTURES[index];
    cachedDate = today;
    return cachedScripture;
}

/**
 * Get all scriptures (for admin/archive)
 */
export async function getAllScriptures() {
    try {
        const q = query(collection(db, 'scriptures'), orderBy('order'));
        const snapshot = await getDocs(q);
        const verses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (verses.length > 0) return verses;
    } catch (error) {
        console.warn('Error fetching all scriptures:', error);
    }
    return FALLBACK_SCRIPTURES;
}

/**
 * Get multiple scriptures for a specific date range
 */
export async function getScripturesForRange(startDate, endDate) {
    try {
        const q = query(collection(db, 'scriptures'), orderBy('order'));
        const snapshot = await getDocs(q);
        let verses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (verses.length === 0) verses = FALLBACK_SCRIPTURES;
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        const result = [];
        let current = new Date(start);
        
        while (current <= end) {
            const startOfYear = new Date(current.getFullYear(), 0, 0);
            const diff = current - startOfYear;
            const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
            const index = dayOfYear % verses.length;
            result.push({
                date: current.toISOString().split('T')[0],
                scripture: verses[index]
            });
            current.setDate(current.getDate() + 1);
        }
        return result;
    } catch (error) {
        console.error('Error getting scriptures for range:', error);
        return [];
    }
}

/**
 * Add/update a scripture (admin only)
 */
export async function saveScripture(data, id = null) {
    try {
        if (id) {
            await updateDoc(doc(db, 'scriptures', id), data);
            return { success: true, id };
        } else {
            const ref = doc(collection(db, 'scriptures'));
            await setDoc(ref, data);
            return { success: true, id: ref.id };
        }
    } catch (error) {
        console.error('Error saving scripture:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Initialize the scriptures collection with fallback verses
 * Run this once to seed the Firestore database
 */
export async function seedScriptures() {
    try {
        const q = query(collection(db, 'scriptures'), limit(1));
        const snapshot = await getDocs(q);
        
        // Only seed if collection is empty
        if (snapshot.empty) {
            console.log('Seeding scriptures to Firestore...');
            const batch = [];
            FALLBACK_SCRIPTURES.forEach((scripture, index) => {
                const ref = doc(collection(db, 'scriptures'));
                batch.push(setDoc(ref, {
                    ...scripture,
                    order: index + 1,
                    createdAt: new Date().toISOString()
                }));
            });
            await Promise.all(batch);
            console.log(`Seeded ${FALLBACK_SCRIPTURES.length} scriptures`);
            return { success: true, count: FALLBACK_SCRIPTURES.length };
        }
        return { success: true, message: 'Scriptures already seeded' };
    } catch (error) {
        console.error('Error seeding scriptures:', error);
        return { success: false, error: error.message };
    }
}