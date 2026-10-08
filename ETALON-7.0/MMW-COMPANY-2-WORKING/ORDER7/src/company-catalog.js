const CATALOG_VERSION="2026-10-03";
const projectNames={
 "aladin-residence":"ALADIN RESIDENCE","nexus-work":"NEXUS WORK","nexus-logistics":"NEXUS LOGISTICS",
 "carpathia-eco-lodge":"CARPATHIA ECO LODGE","agrohub":"AGROHUB","energy-park":"ENERGY PARK"
};
const items=[
 {id:"project-audit",category:"Развитие проектов",name:"Предпроектный аудит",price:15000,from:false,unit:"проект",description:"Первичная проверка возможности: исходные данные, рынок, площадка и ключевые вопросы реализации."},
 {id:"project-concept",category:"Развитие проектов",name:"PROJECT CONCEPT",price:49000,from:false,unit:"проект",description:"Разработка и структурирование концепции проекта с продуктовой логикой и планом дальнейшей проверки."},
 {id:"business-project",category:"Развитие проектов",name:"BUSINESS PROJECT",price:119000,from:false,unit:"проект",description:"Бизнес-модель, финансовый контур, план запуска и рабочая структура проекта."},
 {id:"investment-project",category:"Инвестиции",name:"INVESTMENT PROJECT",price:169000,from:false,unit:"проект",description:"Инвестиционная упаковка, экономика, структура сделки и материалы для работы с капиталом."},
 {id:"business-system",category:"Управление",name:"BUSINESS SYSTEM",price:249000,from:false,unit:"проект",description:"Проектирование управленческой и операционной системы: процессы, роли, контроль и KPI."},
 {id:"business-restart",category:"Развитие проектов",name:"BUSINESS RESTART",price:99000,from:false,unit:"проект",description:"Диагностика действующего бизнеса, новая модель, план изменений и приоритеты."},
 {id:"business-investor",category:"Инвестиции",name:"BUSINESS + INVESTOR",price:229000,from:false,unit:"проект",description:"Бизнес-проект и комплексная подготовка к работе с инвестором."},
 {id:"custom-business-project",category:"Развитие проектов",name:"CUSTOM BUSINESS PROJECT",price:299000,from:true,unit:"проект",description:"Индивидуальный комплексный проект под нестандартную задачу."},
 {id:"large-scale",category:"Развитие проектов",name:"LARGE SCALE",price:499000,from:true,unit:"проект",description:"Крупный комплексный проект с расширенным сопровождением."},
 {id:"estimate",category:"Отдельные услуги",name:"Расширенная смета",price:12000,from:false,unit:"задача",description:"Детализированный расчёт стоимости по согласованным исходным данным."},
 {id:"site-survey",category:"Отдельные услуги",name:"Выезд / обследование объекта",price:8000,from:false,unit:"выезд",description:"Первичное обследование площадки или объекта и фиксация исходных данных."},
 {id:"docs",category:"Отдельные услуги",name:"Дополнительный комплект документов",price:7500,from:false,unit:"комплект",description:"Подготовка дополнительного набора рабочих форм и документов."},
 {id:"management",category:"Отдельные услуги",name:"Проектное сопровождение",price:18000,from:false,unit:"месяц",description:"Координация задач, участников, сроков и контрольных точек проекта."},
 {id:"urgent",category:"Отдельные услуги",name:"Срочное оформление",price:10000,from:false,unit:"задача",description:"Приоритетная подготовка согласованного объёма работ."},
 ...Object.entries(projectNames).map(([id,name])=>({id:"start-"+id,category:"Проекты MMW-COMPANY",name:name+" · старт проекта",price:15000,from:true,unit:"проект",description:"Стартовая предпроектная оценка конкретного проекта MMW-COMPANY. Финальный объём и бюджет определяются после проверки исходных данных."}))
];
module.exports={CATALOG_VERSION,items,projectNames};
