// GENERADO por scripts/make-puzzles.mjs: no editar a mano.
export default [
  {
    "id": 1,
    "type": "cerradura",
    "theme": "detective",
    "level": 1,
    "title": "La caja fuerte",
    "clue": "Tres cifras distintas abren la caja fuerte del despacho. El detective anotó sus intentos y lo que le dijo la cerradura.",
    "hint": "Las tres cifras son pares.",
    "data": [
      {
        "g": "365",
        "bien": 0,
        "mal": 0
      },
      {
        "g": "307",
        "bien": 0,
        "mal": 0
      },
      {
        "g": "519",
        "bien": 0,
        "mal": 0
      },
      {
        "g": "403",
        "bien": 1,
        "mal": 0
      },
      {
        "g": "729",
        "bien": 0,
        "mal": 1
      }
    ],
    "h": "d5hjbmmc9e"
  },
  {
    "id": 2,
    "type": "morse",
    "theme": "policial",
    "level": 1,
    "title": "Radio de la comisaría",
    "clue": "Una señal entrecortada en la radio de la policía. Alguien golpea un mensaje en clave.",
    "hint": "Son tres palabras. La del medio es muy corta: solo dos letras.",
    "data": ".-.. .-.. .- -- .- / .- .-.. / .. -. ... .--. . -.-. - --- .-.",
    "h": "18b1iinu5ck"
  },
  {
    "id": 3,
    "type": "anagrama",
    "theme": "egipcio",
    "level": 2,
    "title": "Jeroglíficos revueltos",
    "clue": "Las letras de una orden han quedado mezcladas sobre el papiro. Ordénalas para leerla.",
    "hint": "Empieza por A. Son tres palabras.",
    "data": {
      "pool": "EARUBABLTAM",
      "lens": [
        4,
        2,
        5
      ]
    },
    "h": "2bi2uub7bx8"
  },
  {
    "id": 4,
    "type": "cesar",
    "theme": "alien",
    "level": 2,
    "title": "Transmisión desconocida",
    "clue": "Una señal captada desde el espacio. Cada letra está desplazada, pero esta vez nadie te dice cuánto.",
    "hint": "El desplazamiento está entre 5 y 9.",
    "data": "UV LZAHTVZ ZVSVZ",
    "h": "rke3c8fhda"
  },
  {
    "id": 5,
    "type": "acrostico",
    "theme": "detective",
    "level": 3,
    "title": "La carta sin firma",
    "clue": "Una carta anónima llega al despacho. Parece un relato sin importancia, pero el que la escribió te dejó un mensaje.",
    "hint": "La palabra tiene seis letras: es lo que proyecta un cuerpo cuando le da la luz.",
    "data": [
      "Siempre llegaba tarde a las citas del puerto.",
      "Observaba a todos desde la última mesa.",
      "Murmuraba un nombre que nadie conocía.",
      "Bebía su café sin quitarse el abrigo.",
      "Rompió la carta antes de que la leyéramos.",
      "Al salir, dejó la puerta entreabierta."
    ],
    "h": "gwtjzxfe1d"
  },
  {
    "id": 6,
    "type": "simbolos",
    "theme": "alien",
    "level": 4,
    "title": "Alfabeto desconocido",
    "clue": "Unos símbolos aparecen grabados en una roca del desierto. Junto a ellos, alguien dibujó la clave para leerlos.",
    "hint": "La segunda palabra tiene solo dos letras.",
    "data": "RYYBF LN RFGNA NDHV",
    "h": "9n3torbw4l"
  },
  {
    "id": 7,
    "type": "vigenere",
    "theme": "alien",
    "level": 5,
    "title": "Primer mensaje con clave",
    "clue": "Un mensaje cifrado con una palabra clave que se repite debajo de las letras. Hoy la clave te la damos: es SOL.",
    "hint": "Cada letra de la clave mueve la de arriba: la S mueve 18 puestos, la O 14 y la L 11.",
    "data": {
      "cipher": "DOD DINWG CWUCWGLF OW SBZUVPUSC",
      "len": 3,
      "kh": "7os3gn6zip",
      "key": "SOL"
    },
    "h": "dwdbdotsku"
  },
  {
    "id": 8,
    "type": "sopa",
    "theme": "alien",
    "level": 1,
    "title": "Mensaje de la sonda",
    "clue": "La sonda ha devuelto una cuadrícula de símbolos. Los ingenieros dicen que, al quitar las palabras conocidas, lo que queda es el verdadero mensaje.",
    "hint": "Son tres palabras y la última es AZUL.",
    "data": {
      "size": 6,
      "grid": [
        "AALIEN",
        "SSLELP",
        "TOLUAN",
        "RNETNA",
        "ODAZUA",
        "LANAVE"
      ],
      "words": [
        {
          "w": "NAVE",
          "h": "12q3qn2dink",
          "len": 4
        },
        {
          "w": "ALIEN",
          "h": "sdv6pjtkge",
          "len": 5
        },
        {
          "w": "SONDA",
          "h": "137hkhzx7um",
          "len": 5
        },
        {
          "w": "LUNA",
          "h": "g93ki3jyrv",
          "len": 4
        },
        {
          "w": "ASTRO",
          "h": "1zehk2nvayx",
          "len": 5
        }
      ],
      "secretLen": 13
    },
    "h": "cknyubmq4l"
  },
  {
    "id": 9,
    "type": "simbolos",
    "theme": "detective",
    "level": 1,
    "title": "Nota en el cajón",
    "clue": "Una nota con símbolos en lugar de letras. La clave está dibujada debajo.",
    "hint": "Son cuatro palabras y la segunda es EN.",
    "data": "ZVEN RA RY PNWBA",
    "h": "jz6dzhz2hs"
  },
  {
    "id": 10,
    "type": "cesar",
    "theme": "egipcio",
    "level": 2,
    "title": "Papiro del escriba",
    "clue": "Un escriba movió cada letra del papiro el mismo número de puestos. Esta vez nadie te dice cuántos.",
    "hint": "El desplazamiento está entre 7 y 11.",
    "data": "UJ CDVKJ NBCJ EJLRJ",
    "h": "1n3irspogun"
  },
  {
    "id": 11,
    "type": "simbolos",
    "theme": "alien",
    "level": 2,
    "title": "Inscripción en la nave",
    "clue": "Unos símbolos recorren el casco de la nave. Alguien grabó la clave en una placa cercana.",
    "hint": "Son cinco palabras y la última es LUZ.",
    "data": "AB ZVERF N YN YHM",
    "h": "21ewl5p4q4u"
  },
  {
    "id": 12,
    "type": "escitala",
    "theme": "egipcio",
    "level": 3,
    "title": "Vara del sacerdote",
    "clue": "Un sacerdote te da una cinta de lino con signos revueltos y una vara de medir. Solo con el grosor correcto aparece el mensaje.",
    "hint": "Son cinco palabras y la última es AMULETO.",
    "data": {
      "cipher": "LMUDLLAISIAEMATAMTOCOEUO"
    },
    "h": "239mw5cnww1"
  },
  {
    "id": 13,
    "type": "criptico",
    "theme": "egipcio",
    "level": 4,
    "title": "La joya de Cleopatra",
    "clue": "Una pieza se cuela dentro de otra y entre las dos forman la respuesta. Fíjate en el aviso.",
    "data": {
      "clue": "Joya del mar: pera con ele dentro",
      "lens": [
        5
      ],
      "def": "Joya del mar",
      "kind": "contenedor",
      "indicator": "dentro",
      "first": "P",
      "explain": "LnJvZGVuZXRub2MgZWQgb3NpdmEgbGUgc2UgwrtvcnRuZWTCqyBvc2Ugcm9QIC5BLUwtUkVQIDrCu2FyZXDCqyBlZCBvcnRuZWQgKUwgYXJ0ZWwgYWwoIMK7ZWxlwqsgYWwgc2V0ZU0gLsK7cmFtIGxlZCBheW9qwqsgc2UgbsOzaWNpbmlmZWQgYUw="
    },
    "h": "xywv449vop"
  },
  {
    "id": 14,
    "type": "vigenere",
    "theme": "egipcio",
    "level": 5,
    "title": "Clave del escriba",
    "clue": "El escriba cifró el mensaje con una palabra clave. Esta vez te la damos: es el río de Egipto.",
    "hint": "La clave se repite sin contar los espacios: N, I, L, O, N, I, L, O...",
    "data": {
      "cipher": "YI EIZJL GR IMFR IW OZIYSPMC",
      "len": 4,
      "kh": "24yir9875t6",
      "key": "NILO"
    },
    "h": "vd37p2xyxn"
  },
  {
    "id": 15,
    "type": "anagrama",
    "theme": "detective",
    "level": 1,
    "title": "Letras sobre el escritorio",
    "clue": "Alguien dejó una palabra mezclada sobre el escritorio del detective. Es lo que queda marcado tras una huida.",
    "hint": "Se queda marcada en un vaso o en una puerta.",
    "data": {
      "pool": "EAULHL",
      "lens": [
        6
      ]
    },
    "h": "26ccf5rof4n"
  },
  {
    "id": 16,
    "type": "morse",
    "theme": "policial",
    "level": 1,
    "title": "Alto, policía",
    "clue": "Por la radio llega una orden corta hecha de puntos y rayas.",
    "hint": "Son dos palabras y la segunda es POLICIA.",
    "data": ".- .-.. - --- / .--. --- .-.. .. -.-. .. .-",
    "h": "1wh76ik8j6q"
  },
  {
    "id": 17,
    "type": "sopa",
    "theme": "alien",
    "level": 2,
    "title": "Diario de a bordo",
    "clue": "El diario de a bordo de la nave está lleno de letras sueltas. Las palabras del vocabulario espacial están dentro, algunas al revés. Lo que sobra es la clave del piloto.",
    "hint": "Son dos palabras y la última es RADAR.",
    "data": {
      "size": 7,
      "grid": [
        "OMELREG",
        "RASADTA",
        "BRAOZEL",
        "ITOULHA",
        "TELBROX",
        "ATEMOCI",
        "PLANETA"
      ],
      "words": [
        {
          "w": "COHETE",
          "h": "2f9o6yq9af0",
          "len": 6
        },
        {
          "w": "GALAXIA",
          "h": "hfsj1nd017",
          "len": 7
        },
        {
          "w": "PLANETA",
          "h": "1wrpr98smvv",
          "len": 7
        },
        {
          "w": "COMETA",
          "h": "124a3n8htzk",
          "len": 6
        },
        {
          "w": "ORBITA",
          "h": "ylrl4oewdv",
          "len": 6
        },
        {
          "w": "ROBOT",
          "h": "hry0ex59ls",
          "len": 5
        },
        {
          "w": "MARTE",
          "h": "z2l6k8tpyc",
          "len": 5
        },
        {
          "w": "SOL",
          "h": "243tnpnfagk",
          "len": 3
        },
        {
          "w": "LUZ",
          "h": "tf0ckd9uzd",
          "len": 3
        }
      ],
      "secretLen": 7
    },
    "h": "1y1l8w8dql6"
  },
  {
    "id": 18,
    "type": "teclado",
    "theme": "policial",
    "level": 2,
    "title": "Mensaje en el móvil",
    "clue": "Un móvil antiguo guarda un mensaje escrito a base de pulsaciones. Cada grupo es una letra.",
    "hint": "Son cuatro palabras y la última es HABLARA.",
    "data": "33 555 / 8 33 7777 8 444 4 666 / 66 666 / 44 2 22 555 2 777 2",
    "h": "24786n4mp7p"
  },
  {
    "id": 19,
    "type": "interrogatorio",
    "theme": "detective",
    "level": 3,
    "title": "El maletín desaparecido",
    "clue": "El maletín del cliente ha desaparecido de la oficina. Cuatro personas estaban allí y cada una declaró.",
    "hint": "No fue Pablo.",
    "data": {
      "suspects": [
        "Carlos",
        "Elena",
        "Pablo",
        "Sofía"
      ],
      "statements": [
        {
          "by": "Carlos",
          "says": "Elena no fue."
        },
        {
          "by": "Elena",
          "says": "Tengo claro que fue Carlos."
        },
        {
          "by": "Pablo",
          "says": "Ni yo ni Sofía fuimos."
        },
        {
          "by": "Sofía",
          "says": "Fue Pablo."
        }
      ],
      "rule": "unoMiente"
    },
    "h": "4obik5142n"
  },
  {
    "id": 20,
    "type": "criptico",
    "theme": "detective",
    "level": 4,
    "title": "Vuelta atrás",
    "clue": "Hay que leer una palabra de atrás hacia delante. La pista te dice cuál es, describiéndola con otras palabras.",
    "data": {
      "clue": "Roedor: unir con cuerda, devuelto",
      "lens": [
        4
      ],
      "def": "Roedor",
      "kind": "reves",
      "indicator": "devuelto",
      "first": "R",
      "explain": "LkFUQVIgbmUgZXRyZWl2bm9jIGVzIFJBVEEgOnPDqXZlciBsYSBlZWwgZXMgZXVxIGVkIGFzaXZhIMK7b3RsZXV2ZWTCqyB5ICxSQVRBIHNlIMK7YWRyZXVjIG5vYyByaW5VwqsgLsK7cm9kZW9ywqsgc2UgbsOzaWNpbmlmZWQgYUw="
    },
    "h": "1mpc2puzphy"
  },
  {
    "id": 21,
    "type": "vigenere",
    "theme": "detective",
    "level": 5,
    "title": "La clave del detective",
    "clue": "Un mensaje cifrado con la clave LUPA. Cada letra del mensaje se mueve según la letra de la clave que le toca.",
    "hint": "La L mueve 11 puestos, la U 20, la P 15 y la A ninguno.",
    "data": {
      "cipher": "PF RUWJPBWY HIPGERP XTJL OCA SOTLWU",
      "len": 4,
      "kh": "204mcbh9h6u",
      "key": "LUPA"
    },
    "h": "2dvk5j3pmuv"
  },
  {
    "id": 22,
    "type": "cesar",
    "theme": "detective",
    "level": 1,
    "title": "Nota bajo la puerta",
    "clue": "Alguien deslizó una nota bajo la puerta. Cada letra está movida del alfabeto. La A se escribe C.",
    "hint": "Gira la rueda hasta que la A de dentro quede bajo la C de fuera.",
    "data": "PCFKG UCNKQ FG ECUC",
    "h": "oostmjrcfo"
  },
  {
    "id": 23,
    "type": "simbolos",
    "theme": "policial",
    "level": 1,
    "title": "Nota en símbolos",
    "clue": "Una nota con símbolos en lugar de letras. La clave está pegada en el reverso.",
    "hint": "Son cuatro palabras y la segunda es Y.",
    "data": "NYGB L ZNABF NEEVON",
    "h": "2nmy0jd1bw"
  },
  {
    "id": 24,
    "type": "golpes",
    "theme": "detective",
    "level": 2,
    "title": "Mensaje entre rejas",
    "clue": "Un compañero de celda te cuenta un secreto a golpes. Cada letra son dos números: fila y columna. Escucha con calma.",
    "hint": "Son cinco palabras y la última es TRAIDOR.",
    "data": "15 31 / 24 33 43 35 15 13 44 34 42 / 13 34 33 34 13 15 / 11 31 / 44 42 11 24 14 34 42",
    "h": "c5f2iadeyc"
  },
  {
    "id": 25,
    "type": "espejo",
    "theme": "policial",
    "level": 2,
    "title": "Plano al revés",
    "clue": "Un plano escrito en espejo. Cada letra del texto es la que ocupa el lugar contrario en el alfabeto.",
    "hint": "Son cinco palabras y la última es SOTANO.",
    "data": "OZ VHXZOVIZ XLMWFXV ZO HLGZML",
    "h": "8s125o54t8"
  },
  {
    "id": 26,
    "type": "cesar",
    "theme": "policial",
    "level": 3,
    "title": "Pintada en el muro",
    "clue": "Una pintada con letras cambiadas. El que la hizo movió cada letra la misma cantidad de puestos.",
    "hint": "El desplazamiento es menor que 8.",
    "data": "JQ YJXYNLT ST INOT YTIT",
    "h": "x5l0wi4gb3"
  },
  {
    "id": 27,
    "type": "criptico",
    "theme": "policial",
    "level": 4,
    "title": "La contraseña del ancla",
    "clue": "A veces la respuesta no hay que fabricarla: ya está escrita en la pista, escondida entre otras letras.",
    "data": {
      "clue": "Contraseña escondida en el ancla vetusta",
      "lens": [
        5
      ],
      "def": "Contraseña",
      "kind": "escondida",
      "indicator": "escondida en",
      "first": "C",
      "explain": "LkVWQUxDIG5hbXJvZiBzYWRpdWdlcyBzYXJ0ZWwgc2FMIC5hdHN1dC1FViBBTEMtbmEgOmFydG8gYSBhcmJhbGFwIGFudSBlZCBvZG5henVyYyAsb3R4ZXQgbGVkIG9ydG5lZCDDoXRzZSBhdHNldXBzZXIgYWwgZXVxIGVkIGFzaXZhIMK7bmUgYWRpZG5vY3NFwqsgLsK7YcOxZXNhcnRub2PCqyBzZSBuw7NpY2luaWZlZCBhTA=="
    },
    "h": "1y4ghkmiiyd"
  },
  {
    "id": 28,
    "type": "vigenere",
    "theme": "policial",
    "level": 5,
    "title": "Nota de la comisaría",
    "clue": "La clave de hoy es LEY: una palabra corta que se repite una y otra vez bajo el mensaje.",
    "hint": "La L mueve 11 puestos, la E 4 y la Y 24.",
    "data": {
      "cipher": "PP GYJMCQC OIQLTYCIATS BP PY NSKTWYCMY",
      "len": 3,
      "kh": "1noi7z8q0l4",
      "key": "LEY"
    },
    "h": "5fklrfjpw8"
  },
  {
    "id": 29,
    "type": "anagrama",
    "theme": "policial",
    "level": 1,
    "title": "Pruebas desordenadas",
    "clue": "Alguien revolvió el archivo y las letras de una palabra clave quedaron mezcladas.",
    "hint": "Es alguien que vio lo ocurrido.",
    "data": {
      "pool": "ETGIOST",
      "lens": [
        7
      ]
    },
    "h": "b68avv67df"
  },
  {
    "id": 30,
    "type": "morse",
    "theme": "detective",
    "level": 1,
    "title": "Aviso desde la celda",
    "clue": "Desde la celda llegan unos golpes cortos y largos. Alguien quiere decirte algo.",
    "hint": "Son tres palabras y la última es JARDINERO.",
    "data": "-... ..- ... -.-. .- / .- .-.. / .--- .- .-. -.. .. -. . .-. ---",
    "h": "135sa7wiief"
  },
  {
    "id": 31,
    "type": "sopa",
    "theme": "policial",
    "level": 2,
    "title": "Archivo de la comisaría",
    "clue": "Alguien dejó una nota escondida en la sopa de letras que repartieron en la comisaría. Hay palabras al derecho y al revés. Las letras sobrantes forman la nota.",
    "hint": "Son tres palabras y la última es FALSA.",
    "data": {
      "size": 7,
      "grid": [
        "FIANZAE",
        "LAAPDLS",
        "RURLEIP",
        "BAEMFBO",
        "ACLSAIS",
        "PISTOLA",
        "AANERIS"
      ],
      "words": [
        {
          "w": "ESPOSAS",
          "h": "1l7lv1gyfw6",
          "len": 7
        },
        {
          "w": "CELDA",
          "h": "vaqph46acc",
          "len": 5
        },
        {
          "w": "ALIBI",
          "h": "21romc276y5",
          "len": 5
        },
        {
          "w": "FIANZA",
          "h": "1whmt3rwh3q",
          "len": 6
        },
        {
          "w": "SIRENA",
          "h": "2dttb1ssnrj",
          "len": 6
        },
        {
          "w": "PISTOLA",
          "h": "y92aymkytz",
          "len": 7
        },
        {
          "w": "ARMA",
          "h": "1z01chqqln4",
          "len": 4
        }
      ],
      "secretLen": 13
    },
    "h": "ljh1fyja9j"
  },
  {
    "id": 32,
    "type": "anagrama",
    "theme": "alien",
    "level": 2,
    "title": "Mensaje en el radar",
    "clue": "El radar muestra una frase con las letras mezcladas.",
    "hint": "Son cuatro palabras y la última es LUNA.",
    "data": {
      "pool": "EIEUAVDLLENANN",
      "lens": [
        6,
        2,
        2,
        4
      ]
    },
    "h": "2cbvp94rm12"
  },
  {
    "id": 33,
    "type": "interrogatorio",
    "theme": "egipcio",
    "level": 3,
    "title": "El papiro robado",
    "clue": "El papiro sagrado ha desaparecido del templo. Cuatro sacerdotes estaban dentro y cada uno declaró.",
    "hint": "No fue Ibi.",
    "data": {
      "suspects": [
        "Kenamón",
        "Meritra",
        "Ibi",
        "Sabu"
      ],
      "statements": [
        {
          "by": "Kenamón",
          "says": "Les aseguro que Ibi es inocente."
        },
        {
          "by": "Meritra",
          "says": "Yo no fui."
        },
        {
          "by": "Ibi",
          "says": "No fue Sabu."
        },
        {
          "by": "Sabu",
          "says": "Fui yo o fue Kenamón."
        }
      ],
      "rule": "unoMiente"
    },
    "h": "of1piafnd7"
  },
  {
    "id": 34,
    "type": "criptico",
    "theme": "policial",
    "level": 4,
    "title": "El archivo cerrado",
    "clue": "Esta vez no hay juego de letras. La pista dice lo mismo dos veces, de dos maneras distintas.",
    "data": {
      "clue": "Abre la puerta y cierra el agua",
      "lens": [
        5
      ],
      "def": "Abre la puerta",
      "def2": "cierra el agua",
      "kind": "doble",
      "first": "L",
      "explain": "LkVWQUxMIGFudSBlY2FoIGV1cSBzYXNvYyBub3MgwrthdWdhIGxlIGFycmVpY8KrIHkgwrthdHJldXAgYWwgZXJiQcKrIC5hcmJhbGFwIGFtc2ltIGFsIGEgbmF2ZWxsIGV1cSBzYXRsZXVzIHNhdHNpcCBzb2QgOm7Ds2ljaW5pZmVkIGVsYm9kIGFudSBzRQ=="
    },
    "h": "1qsgiwppar6"
  },
  {
    "id": 35,
    "type": "vigenere",
    "theme": "alien",
    "level": 5,
    "title": "Visita breve",
    "clue": "Un mensaje cifrado cuya clave no te dan: hay que adivinarla y escribirla para activar la ayuda. La clave es el cuerpo celeste con cola de hielo y polvo. Tiene seis letras.",
    "hint": "La clave empieza por C.",
    "data": {
      "cipher": "PIQWMRC JUWBTC HQVFIPO OYTNFC EEEGC SX TKIOSD VTYQ",
      "len": 6,
      "kh": "210g8v42m9o"
    },
    "h": "10u77m3xyzt"
  },
  {
    "id": 36,
    "type": "teclado",
    "theme": "alien",
    "level": 1,
    "title": "Saludo desde el espacio",
    "clue": "Un comunicador antiguo recibe una secuencia de teclas desde muy lejos. Cada grupo es una letra.",
    "hint": "Son dos palabras y la primera es HOLA.",
    "data": "44 666 555 2 / 8 33 777 777 444 222 666 555 2",
    "h": "19jmgvio6nn"
  },
  {
    "id": 37,
    "type": "cerradura",
    "theme": "egipcio",
    "level": 1,
    "title": "El cofre de la tumba",
    "clue": "El cofre se cierra con tres cifras distintas. Un explorador marcó en el barro sus intentos.",
    "hint": "Solo una de las cifras es par.",
    "data": [
      {
        "g": "170",
        "bien": 0,
        "mal": 0
      },
      {
        "g": "291",
        "bien": 1,
        "mal": 1
      },
      {
        "g": "520",
        "bien": 0,
        "mal": 2
      }
    ],
    "h": "qv7wh7w55i"
  },
  {
    "id": 38,
    "type": "golpes",
    "theme": "policial",
    "level": 2,
    "title": "Comunicado de la celda 9",
    "clue": "Por las tuberías de la prisión llegan golpes en grupos. Cada letra son dos números: fila y columna.",
    "hint": "Son cinco palabras y la última es MADRUGADA.",
    "data": "15 31 / 25 15 21 15 / 43 11 31 14 42 11 / 14 15 / 32 11 14 42 45 22 11 14 11",
    "h": "218j25t2n4z"
  },
  {
    "id": 39,
    "type": "cerradura",
    "theme": "policial",
    "level": 2,
    "title": "Candado de la taquilla",
    "clue": "La taquilla de pruebas se abre con tres cifras distintas. Un compañero anotó sus intentos.",
    "hint": "Solo una de las cifras es impar.",
    "data": [
      {
        "g": "354",
        "bien": 0,
        "mal": 0
      },
      {
        "g": "531",
        "bien": 0,
        "mal": 1
      },
      {
        "g": "216",
        "bien": 1,
        "mal": 1
      },
      {
        "g": "528",
        "bien": 1,
        "mal": 0
      }
    ],
    "h": "90qpllyp3t"
  },
  {
    "id": 40,
    "type": "sopa",
    "theme": "egipcio",
    "level": 3,
    "title": "La cámara oculta",
    "clue": "Los arqueólogos copiaron una cuadrícula del muro de la cámara oculta. Las palabras sagradas se describen, no se nombran, y pueden leerse en cualquier dirección. Las letras libres nombran lo que buscan.",
    "hint": "Son dos palabras y la última es SARCOFAGO.",
    "data": {
      "size": 8,
      "grid": [
        "COLUMNAO",
        "YTELOTET",
        "SEUAESSE",
        "ARRMOCFL",
        "OAPLBFIU",
        "FLAGOANM",
        "ORIPAPGA",
        "OTREISED"
      ],
      "words": [
        {
          "h": "16t3y8lyl8t",
          "len": 7,
          "c": "León con cara humana"
        },
        {
          "h": "1yu3kdviqcy",
          "len": 7,
          "c": "Pilar de piedra que sostiene el techo"
        },
        {
          "h": "77u98d7yti",
          "len": 8,
          "c": "Mar de arena"
        },
        {
          "h": "1gxvyf37jk0",
          "len": 7,
          "c": "Objeto que protege de la mala suerte"
        },
        {
          "h": "18x4dj9si6h",
          "len": 6,
          "c": "Sobre él escribían los escribas"
        },
        {
          "h": "obbg1vcthx",
          "len": 5,
          "c": "Donde reposa el faraón"
        },
        {
          "h": "22tfns1pgea",
          "len": 6,
          "c": "Rey del antiguo Egipto"
        },
        {
          "h": "244oo4t3yjt",
          "len": 6,
          "c": "Casa de los dioses"
        },
        {
          "h": "243tnpnfagk",
          "len": 3,
          "c": "Astro que da luz y calor"
        },
        {
          "h": "1z10q167i87",
          "len": 3,
          "c": "Gobierna un reino"
        }
      ],
      "secretLen": 11
    },
    "h": "1k0l8mwy50w"
  },
  {
    "id": 41,
    "type": "criptico",
    "theme": "detective",
    "level": 4,
    "title": "Correo de madrugada",
    "clue": "Un mensaje llega antes del amanecer. Una parte te dice qué es; la otra esconde la palabra entre letras revueltas.",
    "data": {
      "clue": "Mensaje por escrito: traca alterada",
      "lens": [
        5
      ],
      "def": "Mensaje por escrito",
      "kind": "anagrama",
      "indicator": "alterada",
      "first": "C",
      "explain": "LkFUUkFDIG9tb2MgYW5lZHJvZXIgZXMgQS1DLUEtUi1UIDphbWFyZ2FuYSBlZCBvc2l2YSAsYWRhcmV0bGEgw6F0c2UgKXNvZHJhdGVwIGVkIGFyaXQgYW51KCDCu2FjYXJUwqsgLsK7b3RpcmNzZSByb3AgZWphc25lbcKrIHNlIG7Ds2ljaW5pZmVkIGFM"
    },
    "h": "1aebciexo0j"
  },
  {
    "id": 42,
    "type": "vigenere",
    "theme": "policial",
    "level": 5,
    "title": "Prueba oculta",
    "clue": "Un mensaje cifrado cuya clave no te dan: hay que adivinarla y escribirla para activar la ayuda. La clave es lo que usó el culpable y nunca encontraron. Tiene cuatro letras.",
    "hint": "La clave empieza por A.",
    "data": {
      "cipher": "EC EOSGQCHFEO LR QSCFZDIF NAJF QL PLQNTV",
      "len": 4,
      "kh": "11t9whf286o"
    },
    "h": "7qhfsgdjqm"
  },
  {
    "id": 43,
    "type": "teclado",
    "theme": "detective",
    "level": 1,
    "title": "Taxi a medianoche",
    "clue": "Un papel con números de un móvil antiguo. Cada grupo es una letra.",
    "hint": "Son tres palabras y la última es TAXI.",
    "data": "7777 444 4 88 33 / 2 555 / 8 2 99 444",
    "h": "5bgze0va51"
  },
  {
    "id": 44,
    "type": "espejo",
    "theme": "egipcio",
    "level": 1,
    "title": "Inscripción en el espejo",
    "clue": "Una inscripción en espejo: el alfabeto está al revés y cada letra ocupa el lugar contrario.",
    "hint": "Son cuatro palabras y la última es SAGRADO.",
    "data": "VO IRL VH HZTIZWL",
    "h": "2fs3vgritx4"
  },
  {
    "id": 45,
    "type": "morse",
    "theme": "alien",
    "level": 2,
    "title": "Pulsos en la antena",
    "clue": "La antena de la base capta pulsos largos y cortos. Parece un mensaje.",
    "hint": "Son cuatro palabras y la segunda es ANTENA.",
    "data": ".-.. .- / .- -. - . -. .- / .-. . -.-. .. -... . / .- .-.. --. ---",
    "h": "jqmqegp7af"
  },
  {
    "id": 46,
    "type": "espejo",
    "theme": "detective",
    "level": 2,
    "title": "Reloj en el espejo",
    "clue": "Un papel escrito en espejo: cada letra ocupa el lugar contrario del alfabeto.",
    "hint": "Son cuatro palabras y la última es ADELANTADO.",
    "data": "VO IVOLQ VHGZ ZWVOZMGZWL",
    "h": "zgjp7gp72v"
  },
  {
    "id": 47,
    "type": "escitala",
    "theme": "alien",
    "level": 3,
    "title": "Cinta de la sonda",
    "clue": "La sonda ha devuelto una cinta con símbolos mezclados. Los ingenieros creen que se leen enrollándola en un cilindro del diámetro adecuado.",
    "hint": "Son cinco palabras y la última es AMANECER.",
    "data": {
      "cipher": "LEAARMNRAAINVZEEACAAETLR"
    },
    "h": "g1dyswyvkl"
  },
  {
    "id": 48,
    "type": "criptico",
    "theme": "policial",
    "level": 4,
    "title": "Oculto a plena vista",
    "clue": "La respuesta ya está escrita en la pista, escondida entre dos palabras seguidas.",
    "data": {
      "clue": "Marca de lacre oculta cuando se llora",
      "lens": [
        5
      ],
      "def": "Marca de lacre",
      "kind": "escondida",
      "indicator": "oculta",
      "first": "S",
      "explain": "Lk9MTEVTIG5hbXJvZiBPLUwtTC1FLVMgc2FkaXVnZXMgc2FydGVsIHNhTCAuYXItT0xMLUVTIDrCu2Fyb2xsIGVzwqsgYXJpTSAub3R4ZXQgbGUgbmUgYWRpZG5vY3NlIMOhdHNlIGF0c2V1cHNlciBhbCBldXEgZWQgYXNpdmEgwrthdGx1Y0/CqyAuwrtlcmNhbCBlZCBhY3JhbcKrIHNlIG7Ds2ljaW5pZmVkIGFM"
    },
    "h": "222ye1or5ss"
  },
  {
    "id": 49,
    "type": "vigenere",
    "theme": "detective",
    "level": 5,
    "title": "Último papel",
    "clue": "Un mensaje cifrado cuya clave no te dan: hay que adivinarla y escribirla para activar la ayuda. La clave es lo que sigue siempre un detective. Tiene cinco letras.",
    "hint": "La clave empieza por P.",
    "data": {
      "cipher": "AI NXRSIV XSIITT EHKJBTP MF XL JTLBMD XSIEA",
      "len": 5,
      "kh": "f4oyn3rqqk"
    },
    "h": "h2soh5pjck"
  },
  {
    "id": 50,
    "type": "morse",
    "theme": "alien",
    "level": 1,
    "title": "Baliza espacial",
    "clue": "Una baliza emite destellos largos y cortos. Es la primera señal de la semana.",
    "hint": "Hay tres palabras y la última es un planeta rojo.",
    "data": "... . -. .- .-.. / -.. . ... -.. . / -- .- .-. - .",
    "h": "1mc2jo11i2s"
  },
  {
    "id": 51,
    "type": "golpes",
    "theme": "alien",
    "level": 1,
    "title": "Golpes en el casco",
    "clue": "Alguien golpea el casco de la nave desde fuera. Cada letra son dos números: fila y columna.",
    "hint": "Son dos palabras y la primera es ELLOS.",
    "data": "15 31 31 34 43 / 51 24 15 33 15 33",
    "h": "2g0b9yt31zi"
  },
  {
    "id": 52,
    "type": "teclado",
    "theme": "policial",
    "level": 2,
    "title": "Mensaje del testigo",
    "clue": "El testigo escribió con un móvil antiguo, a base de pulsaciones. Cada grupo es una letra.",
    "hint": "Son cuatro palabras y la última es FALSA.",
    "data": "555 2 / 7 444 7777 8 2 / 33 7777 / 333 2 555 7777 2",
    "h": "1qka37b0xxb"
  },
  {
    "id": 53,
    "type": "morse",
    "theme": "policial",
    "level": 2,
    "title": "Aviso en la frecuencia",
    "clue": "Por la frecuencia policial llega una señal de puntos y rayas.",
    "hint": "Son cuatro palabras y la última es TARDE.",
    "data": ".-.. .- / .--. .- - .-. ..- .-.. .-.. .- / .-.. .-.. . --. .- / - .- .-. -.. .",
    "h": "27cka4x8t0h"
  },
  {
    "id": 54,
    "type": "escitala",
    "theme": "detective",
    "level": 3,
    "title": "El palo de Esparta",
    "clue": "Entre los papeles del sospechoso aparece una tira con letras sin sentido y un palo de madera. Parece un truco de los antiguos espartanos.",
    "hint": "Son seis palabras y la última es TEJADO.",
    "data": {
      "cipher": "EORLSESOLOHTSUEPYJEEACPDHOO"
    },
    "h": "1fb3a3l1pyy"
  },
  {
    "id": 55,
    "type": "criptico",
    "theme": "policial",
    "level": 4,
    "title": "La pista de dos caras",
    "clue": "Esta vez no hay juego de letras. Dos pistas distintas apuntan a la misma palabra: piensa en cosas diferentes que se llaman igual.",
    "data": {
      "clue": "Asiento en el parque y guardián del dinero",
      "lens": [
        5
      ],
      "def": "Asiento en el parque",
      "def2": "guardián del dinero",
      "kind": "doble",
      "first": "B",
      "explain": "Lk9DTkFCIDphcmJhbGFwIGFtc2ltIGFsIGVkIHNvZGFjaWZpbmdpcyBzb2Qgbm9zIMK7b3JlbmlkIGxlZCBuw6FpZHJhdWfCqyB5IMK7ZXVxcmFwIGxlIG5lIG90bmVpc2HCqyA6bsOzaWNpbmlmZWQgZWxib2QgYW51IHNF"
    },
    "h": "1oym3hl0kgp"
  },
  {
    "id": 56,
    "type": "vigenere",
    "theme": "policial",
    "level": 5,
    "title": "El último testigo",
    "clue": "Un mensaje cifrado cuya clave no te dan: hay que adivinarla y escribirla para activar la ayuda. La clave es lo que buscan los jueces y defiende la ley. Tiene ocho letras.",
    "hint": "La clave empieza por J.",
    "data": {
      "cipher": "NF UTAQ YUNXG KMUCEUNG VCCVDX YD NTVQMX NWLBKOO MYUBLKW HJVDTZ",
      "len": 8,
      "kh": "253lby71kwd"
    },
    "h": "q52p8un97j"
  },
  {
    "id": 57,
    "type": "simbolos",
    "theme": "egipcio",
    "level": 1,
    "title": "Símbolos del sarcófago",
    "clue": "Unos dibujos recorren la tapa del sarcófago. Junto a ellos está la clave para leerlos.",
    "hint": "Son tres palabras y la última es DUERME.",
    "data": "YN ZBZVN QHREZR",
    "h": "qx87d2t9u4"
  },
  {
    "id": 58,
    "type": "cesar",
    "theme": "alien",
    "level": 1,
    "title": "Aviso desde la órbita",
    "clue": "Un aviso con las letras movidas. Cada una se ha desplazado del alfabeto. La A se escribe G.",
    "hint": "Gira la rueda hasta que la A de dentro quede bajo la G de fuera.",
    "data": "RG HGYK KYZG IKXIG",
    "h": "1z12txsyb0q"
  },
  {
    "id": 59,
    "type": "cerradura",
    "theme": "policial",
    "level": 2,
    "title": "La caja de pruebas",
    "clue": "La caja de pruebas se cierra con tres cifras distintas. Un agente anotó sus intentos antes de irse.",
    "hint": "La última cifra es la mayor.",
    "data": [
      {
        "g": "672",
        "bien": 1,
        "mal": 1
      },
      {
        "g": "854",
        "bien": 0,
        "mal": 1
      },
      {
        "g": "025",
        "bien": 1,
        "mal": 0
      }
    ],
    "h": "s1tf43rqr8"
  },
  {
    "id": 60,
    "type": "teclado",
    "theme": "alien",
    "level": 2,
    "title": "Mensaje en el walkie",
    "clue": "Un walkie antiguo repite una secuencia de teclas. Alguien quiere avisarte de algo importante.",
    "hint": "Es un consejo de cuatro palabras y la segunda es CONFIES.",
    "data": "66 666 / 222 666 66 333 444 33 7777 / 33 66 / 66 2 3 444 33",
    "h": "19ldbkad076"
  },
  {
    "id": 61,
    "type": "morse",
    "theme": "detective",
    "level": 3,
    "title": "Golpes en la pared",
    "clue": "El prisionero de la celda de al lado lleva toda la noche golpeando la pared. Cortos y largos.",
    "hint": "Habla de un objeto y de dónde está escondido.",
    "data": ".-.. .- / .-.. .-.. .- ...- . / . ... - .- / . -. / . .-.. / .-. . .-.. --- .---",
    "h": "1cc3jrv555w"
  },
  {
    "id": 62,
    "type": "cesar",
    "theme": "egipcio",
    "level": 4,
    "title": "Papiro del faraón",
    "clue": "Un papiro con un desplazamiento que nadie anotó. La frase tiene sentido completo cuando lo encuentras.",
    "hint": "Cada letra se movió más de 10 puestos.",
    "data": "PW QLCLZY RFLCOL PW DPNCPEZ",
    "h": "17tnj62zeis"
  },
  {
    "id": 63,
    "type": "vigenere",
    "theme": "alien",
    "level": 5,
    "title": "La orden final",
    "clue": "Un mensaje cifrado cuya clave no te dan: hay que adivinarla y escribirla para activar la ayuda. La clave es el enorme conjunto de estrellas al que pertenece el Sol. Tiene siete letras.",
    "hint": "La clave empieza por G.",
    "data": {
      "cipher": "RA YASM NUDCIWI EYPPRX CNG OCDBV PGRL AQMRXIKAO MN RA EIBZRG",
      "len": 7,
      "kh": "lonq6fpsjq"
    },
    "h": "254yvz4gghc"
  },
  {
    "id": 64,
    "type": "sopa",
    "theme": "egipcio",
    "level": 1,
    "title": "Pergamino del escriba",
    "clue": "El escriba mezcló su secreto entre signos que parecen letras sueltas. Busca las palabras de la lista; las letras que sobran dicen dónde está lo que buscas.",
    "hint": "Son dos palabras y la última es PIRAMIDE.",
    "data": {
      "size": 6,
      "grid": [
        "NILOFL",
        "TUMBAM",
        "PAPIRO",
        "ASPIAM",
        "RAOMOI",
        "IDELNA"
      ],
      "words": [
        {
          "w": "FARAON",
          "h": "22tfns1pgea",
          "len": 6
        },
        {
          "w": "MOMIA",
          "h": "yw9an4x87x",
          "len": 5
        },
        {
          "w": "NILO",
          "h": "17yapf1433p",
          "len": 4
        },
        {
          "w": "TUMBA",
          "h": "obbg1vcthx",
          "len": 5
        },
        {
          "w": "PAPIRO",
          "h": "18x4dj9si6h",
          "len": 6
        },
        {
          "w": "SOL",
          "h": "243tnpnfagk",
          "len": 3
        }
      ],
      "secretLen": 10
    },
    "h": "bbcgplzgnj"
  },
  {
    "id": 65,
    "type": "golpes",
    "theme": "egipcio",
    "level": 1,
    "title": "Piedras que hablan",
    "clue": "Desde el otro lado del muro de piedra llegan golpes contados. Cada letra son dos números: fila y columna.",
    "hint": "Son tres palabras y la última es HABLA.",
    "data": "31 11 / 15 43 21 24 33 22 15 / 23 11 12 31 11",
    "h": "21x9ur58qk1"
  },
  {
    "id": 66,
    "type": "simbolos",
    "theme": "detective",
    "level": 2,
    "title": "Nota en clave",
    "clue": "Un sobre con símbolos en lugar de letras. La clave está dibujada en el reverso.",
    "hint": "Son cuatro palabras y la segunda es CAJA.",
    "data": "YN PNWN RFGN NOVREGN",
    "h": "18pz8qv66i1"
  },
  {
    "id": 67,
    "type": "morse",
    "theme": "policial",
    "level": 2,
    "title": "Mensaje por radio",
    "clue": "Entre interferencias, la radio de la patrulla repite una señal entrecortada.",
    "hint": "Son cinco palabras y la última es NORTE.",
    "data": ".-.. .- / ... .- .-.. .. -.. .- / . ... - .- / .- .-.. / -. --- .-. - .",
    "h": "14t0ryyrgmr"
  },
  {
    "id": 68,
    "type": "escitala",
    "theme": "policial",
    "level": 3,
    "title": "La tira del mensajero",
    "clue": "Un mensajero te entrega una tira de cuero con letras sin sentido. Dicen que, enrollada en el palo del grosor justo, el mensaje se lee de corrido.",
    "hint": "Son seis palabras y la última es FELPUDO.",
    "data": {
      "cipher": "LEAEAEJLLSOPLTEUAALDVBFO"
    },
    "h": "1f4rgcl9h9i"
  },
  {
    "id": 69,
    "type": "criptico",
    "theme": "detective",
    "level": 4,
    "title": "La carta de Roma",
    "clue": "Un aviso te pide dar la vuelta a algo. Aquí hay que leer una palabra de atrás hacia delante.",
    "data": {
      "clue": "Ciudad eterna: pasión devuelta",
      "lens": [
        4
      ],
      "def": "Ciudad eterna",
      "kind": "reves",
      "indicator": "devuelta",
      "first": "R",
      "explain": "LkFNT1IgbmUgZXRyZWl2bm9jIGVzIFJPTUEgOnPDqXZlciBsYSBvbHJlZWwgZXVxIHlhaCBldXEgZWQgYXNpdmEgwrthdGxldXZlZMKrIHkgLFJPTUEgc2Ugwrtuw7Npc2FQwqsgLsK7YW5yZXRlIGRhZHVpY8KrIHNlIG7Ds2ljaW5pZmVkIGFM"
    },
    "h": "lsinshaqle"
  },
  {
    "id": 70,
    "type": "simbolos",
    "theme": "egipcio",
    "level": 5,
    "title": "Muro de la cámara secreta",
    "clue": "Los símbolos del muro esconden una frase larga. La clave está tallada junto a la entrada.",
    "hint": "Empieza por EL y la tercera palabra es ESTA.",
    "data": "RY FRPERGB RFGN ONWB YN NERAN",
    "h": "vglwpihaqg"
  },
  {
    "id": 71,
    "type": "teclado",
    "theme": "detective",
    "level": 1,
    "title": "Nota en el bolsillo",
    "clue": "Hallas una nota con números en el bolsillo del abrigo. Es del tipo de móvil de antes.",
    "hint": "Dos palabras: el comienzo de la segunda es CER.",
    "data": "222 2 7777 666 / 222 33 777 777 2 3 666",
    "h": "xthj3z1nmt"
  },
  {
    "id": 72,
    "type": "golpes",
    "theme": "detective",
    "level": 1,
    "title": "Aviso entre rejas",
    "clue": "Un preso te manda un aviso golpeando la pared. Cada letra son dos números: fila y columna.",
    "hint": "Son dos palabras y la primera es NO.",
    "data": "33 34 / 23 11 12 31 15 43",
    "h": "5sigt1o8aq"
  },
  {
    "id": 73,
    "type": "morse",
    "theme": "alien",
    "level": 2,
    "title": "Destellos en la ventana",
    "clue": "Por la ventana de la nave entran destellos largos y cortos. Es una señal repetida.",
    "hint": "Son cuatro palabras y la segunda es LUNA.",
    "data": ".-.. .- / .-.. ..- -. .- / -. --- ... / --- -... ... . .-. ...- .-",
    "h": "2ciq15qdu6q"
  },
  {
    "id": 74,
    "type": "espejo",
    "theme": "policial",
    "level": 2,
    "title": "Parte en el espejo",
    "clue": "Un parte policial escrito con el alfabeto invertido. Cada letra es la del lugar contrario.",
    "hint": "Son cuatro palabras y la última es DETENIDO.",
    "data": "VO XLILMVO VHGZ WVGVMRWL",
    "h": "2eh1wvsi38h"
  },
  {
    "id": 75,
    "type": "cesar",
    "theme": "egipcio",
    "level": 3,
    "title": "Tablilla del sabio",
    "clue": "Una tablilla con las letras movidas. Todas se desplazaron lo mismo, pero no sabes cuánto.",
    "hint": "El desplazamiento es mayor que 8 y menor que 12.",
    "data": "OV CKLSY QEKBNK OV ZKZSBY",
    "h": "m5qq7fqqcb"
  },
  {
    "id": 76,
    "type": "criptico",
    "theme": "detective",
    "level": 4,
    "title": "El contenido del equipaje",
    "clue": "Otra letra que se cuela dentro de una palabra de juego. Fíjate en cuál es y en dónde cabe.",
    "data": {
      "clue": "Accesorio para llevar cosas: bolo con ese dentro",
      "lens": [
        5
      ],
      "def": "Accesorio para llevar cosas",
      "kind": "contenedor",
      "indicator": "dentro",
      "first": "B",
      "explain": "LnJvZGVuZXRub2MgZWQgb3NpdmEgbGUgc2UgwrtvcnRuZWTCqyBvc2Ugcm9QIC5PLVMtTE9CIDrCu29sb2LCqyBlZCBvcnRuZWQgKVMgYXJ0ZWwgYWwoIMK7ZXNlwqsgYWwgc2V0ZU0gLsK7c2Fzb2MgcmF2ZWxsIGFyYXAgb2lyb3NlY2Nhwqsgc2UgbsOzaWNpbmlmZWQgYUw="
    },
    "h": "19raak9q8wq"
  },
  {
    "id": 77,
    "type": "simbolos",
    "theme": "detective",
    "level": 5,
    "title": "Confesión cifrada",
    "clue": "El sospechoso dejó su confesión escrita en símbolos. La clave estaba pegada al dorso de la hoja.",
    "hint": "Empieza por EL y habla de una persona.",
    "data": "RY PHYCNOYR RFGHIB QRYNAGR",
    "h": "1s1bs27v1ub"
  },
  {
    "id": 78,
    "type": "cerradura",
    "theme": "policial",
    "level": 1,
    "title": "El casillero de pruebas",
    "clue": "El casillero de pruebas se cierra con tres cifras distintas. Un compañero anotó sus intentos.",
    "hint": "La primera cifra es la menor.",
    "data": [
      {
        "g": "279",
        "bien": 1,
        "mal": 0
      },
      {
        "g": "379",
        "bien": 2,
        "mal": 0
      },
      {
        "g": "627",
        "bien": 0,
        "mal": 2
      }
    ],
    "h": "yu74gf24p9"
  },
  {
    "id": 79,
    "type": "golpes",
    "theme": "policial",
    "level": 1,
    "title": "Golpes en la celda 4",
    "clue": "Alguien golpea la pared de la celda de al lado. Cada letra son dos números: la fila y la columna de la tabla. Primero los golpes de la fila, una pausa, y los de la columna.",
    "hint": "Son tres palabras y la última es ATRAS.",
    "data": "43 11 31 22 11 33 / 35 34 42 / 11 44 42 11 43",
    "h": "1brgj5kx9fg"
  },
  {
    "id": 80,
    "type": "anagrama",
    "theme": "policial",
    "level": 2,
    "title": "Orden en el cuaderno",
    "clue": "En el cuaderno del comisario, las letras de una orden quedaron mezcladas.",
    "hint": "Es una orden de tres palabras sobre quien conducía el coche.",
    "data": {
      "pool": "EEESLTANRRAOFRHC",
      "lens": [
        8,
        2,
        6
      ]
    },
    "h": "euhmiyhlci"
  },
  {
    "id": 81,
    "type": "simbolos",
    "theme": "egipcio",
    "level": 2,
    "title": "Símbolos en la orilla",
    "clue": "Unos símbolos grabados en la orilla del río. La clave está dibujada al lado.",
    "hint": "Son cinco palabras y la cuarta es NILO.",
    "data": "RY NTHN QRY AVYB FHOR",
    "h": "rs04gaxzzf"
  },
  {
    "id": 82,
    "type": "escitala",
    "theme": "egipcio",
    "level": 3,
    "title": "Papiro enrollado",
    "clue": "Un papiro largo y estrecho lleva letras en hilera. Los escribas lo enrollaban en un cilindro para leerlo: busca el grosor del cilindro.",
    "hint": "Son seis palabras y la última es TEMPLO.",
    "data": {
      "cipher": "EERSDRDTPLSOTEAEELTOEATSLMO"
    },
    "h": "53ozl9iehq"
  },
  {
    "id": 83,
    "type": "criptico",
    "theme": "egipcio",
    "level": 4,
    "title": "Una letra se cuela",
    "clue": "Una letra pequeña entra dentro de una palabra. Descubre cuál es y dónde queda bien.",
    "data": {
      "clue": "Capital egipcia: caro con i dentro",
      "lens": [
        5
      ],
      "def": "Capital egipcia",
      "kind": "contenedor",
      "indicator": "dentro",
      "first": "C",
      "explain": "LnJvZGVuZXRub2MgZWQgb3NpdmEgbGUgc2UgwrtvcnRuZWTCqyBvc2Ugcm9QIC5PUi1JLUFDIDrCu29yYWPCqyBlZCBvcnRuZWQgSSBhcnRlbCBhbCBzZXRlTSAuwrthaWNwaWdlIGxhdGlwYWPCqyBzZSBuw7NpY2luaWZlZCBhTA=="
    },
    "h": "17pk2bg67fm"
  },
  {
    "id": 84,
    "type": "vigenere",
    "theme": "policial",
    "level": 5,
    "title": "El juicio",
    "clue": "Un mensaje cifrado cuya clave no te dan: hay que adivinarla y escribirla para activar la ayuda. La clave es lo que se paga para esperar el juicio en libertad. Tiene seis letras.",
    "hint": "La clave empieza por F.",
    "data": {
      "cipher": "JT APTSFLO FZLNW LVARJ XOEPUJ TA CQUJJA QDSFXAEDCNW",
      "len": 6,
      "kh": "14gv2wgyzl6"
    },
    "h": "3ow5unvu1g"
  },
  {
    "id": 85,
    "type": "espejo",
    "theme": "alien",
    "level": 1,
    "title": "Mensaje en el espejo",
    "clue": "Una señal con el alfabeto del revés. Cada letra es la contraria: mira la tabla.",
    "hint": "Son cuatro palabras y la primera es LUCES.",
    "data": "OFXVH VM VO XRVOL",
    "h": "2b8ih7vzz3a"
  },
  {
    "id": 86,
    "type": "anagrama",
    "theme": "policial",
    "level": 1,
    "title": "Fichas del tablón",
    "clue": "Las letras de una palabra del informe cayeron al suelo y quedaron mezcladas.",
    "hint": "Es la persona a la que sigue la policía.",
    "data": {
      "pool": "CSHSEOPSOO",
      "lens": [
        10
      ]
    },
    "h": "3yjrhqqy4r"
  },
  {
    "id": 87,
    "type": "cerradura",
    "theme": "egipcio",
    "level": 2,
    "title": "La puerta de piedra",
    "clue": "Tres cifras distintas giran los discos de la puerta. Otros exploradores dejaron sus intentos grabados.",
    "hint": "Una de las cifras es el cero.",
    "data": [
      {
        "g": "726",
        "bien": 0,
        "mal": 2
      },
      {
        "g": "246",
        "bien": 1,
        "mal": 0
      },
      {
        "g": "340",
        "bien": 1,
        "mal": 0
      }
    ],
    "h": "1x3d6pvgl47"
  },
  {
    "id": 88,
    "type": "interrogatorio",
    "theme": "detective",
    "level": 2,
    "title": "El reloj del abuelo",
    "clue": "Ha desaparecido el reloj del abuelo. Solo tres personas estaban en la casa y cada una hizo una declaración.",
    "hint": "No fue Ana.",
    "data": {
      "suspects": [
        "Marta",
        "Luis",
        "Ana"
      ],
      "statements": [
        {
          "by": "Marta",
          "says": "Fue Luis."
        },
        {
          "by": "Luis",
          "says": "Fui yo o fue Marta."
        },
        {
          "by": "Ana",
          "says": "No fue Luis."
        }
      ],
      "rule": "culpableMiente"
    },
    "h": "2231fn6kd5l"
  },
  {
    "id": 89,
    "type": "acrostico",
    "theme": "alien",
    "level": 3,
    "title": "Diario de campo",
    "clue": "Las anotaciones de un investigador cuentan una noche extraña. Pero la verdadera nota está escondida.",
    "hint": "Es el camino que sigue un planeta alrededor del Sol.",
    "data": [
      "Observamos luces sobre el desierto.",
      "Radio y brújulas dejaron de funcionar.",
      "Bajo el cielo, el silencio era total.",
      "Intentamos acercarnos, pero algo nos frenó.",
      "Tres horas después, todo había desaparecido.",
      "Aún hoy nadie sabe qué ocurrió."
    ],
    "h": "b7ujrnxbjy"
  },
  {
    "id": 90,
    "type": "teclado",
    "theme": "egipcio",
    "level": 4,
    "title": "El móvil del arqueólogo",
    "clue": "Un teléfono antiguo con una pista escrita a base de pulsaciones. Cada grupo es una tecla pulsada varias veces.",
    "hint": "Son cuatro palabras y la tercera tiene solo dos letras.",
    "data": "22 88 7777 222 2 / 22 2 5 666 / 555 2 / 33 7777 333 444 66 4 33",
    "h": "2dt3wfxgnlv"
  },
  {
    "id": 91,
    "type": "vigenere",
    "theme": "detective",
    "level": 5,
    "title": "Noche de invitados",
    "clue": "Un mensaje cifrado cuya clave no te dan: hay que adivinarla y escribirla para activar la ayuda. La clave es lo que usa un criminal para que no lo reconozcan. Tiene siete letras.",
    "hint": "La clave empieza por D.",
    "data": {
      "cipher": "WWVTJ LNV QFAZTZGWK YVNHDV MS DOSLDG UVRN VWDT LNN WMFNR LZ OTSAV",
      "len": 7,
      "kh": "2yvmfuph9u"
    },
    "h": "emoiopmdh5"
  },
  {
    "id": 92,
    "type": "acrostico",
    "theme": "egipcio",
    "level": 1,
    "title": "Crónica del escriba",
    "clue": "Un escriba contó lo que vio en la orilla. Parece un relato corriente, pero escondió algo en su forma.",
    "hint": "Cuatro letras: es el río que cruza Egipto.",
    "data": [
      "Nadie cruzó el río sin permiso del faraón.",
      "Iban las barcas cargadas de grano.",
      "Los sacerdotes vigilaban desde la orilla.",
      "Ojalá el agua suba otra vez este año."
    ],
    "h": "1s11qmivuka"
  },
  {
    "id": 93,
    "type": "teclado",
    "theme": "policial",
    "level": 1,
    "title": "Aviso en el móvil",
    "clue": "Un papel con números de un móvil antiguo. Cada grupo es una letra.",
    "hint": "Son tres palabras y la última es COMISARIO.",
    "data": "555 555 2 6 2 / 2 555 / 222 666 6 444 7777 2 777 444 666",
    "h": "qaxlctv7pr"
  },
  {
    "id": 94,
    "type": "cerradura",
    "theme": "egipcio",
    "level": 2,
    "title": "El sello de la cámara",
    "clue": "Tres discos con cifras distintas sellan la cámara. Otros saqueadores dejaron sus intentos marcados.",
    "hint": "Las tres cifras suman 13.",
    "data": [
      {
        "g": "407",
        "bien": 1,
        "mal": 1
      },
      {
        "g": "790",
        "bien": 0,
        "mal": 2
      },
      {
        "g": "273",
        "bien": 0,
        "mal": 0
      }
    ],
    "h": "lie1cuysi4"
  },
  {
    "id": 95,
    "type": "interrogatorio",
    "theme": "policial",
    "level": 2,
    "title": "Pruebas bajo llave",
    "clue": "Alguien abrió la caja de pruebas de la comisaría. Solo tres agentes tenían las llaves y cada uno declaró.",
    "hint": "No fue Daniel.",
    "data": {
      "suspects": [
        "Rocío",
        "Daniel",
        "Alicia"
      ],
      "statements": [
        {
          "by": "Rocío",
          "says": "Fui yo o fue Alicia."
        },
        {
          "by": "Daniel",
          "says": "Les aseguro que Rocío es inocente."
        },
        {
          "by": "Alicia",
          "says": "Soy inocente."
        }
      ],
      "rule": "culpableMiente"
    },
    "h": "qslwwvpydg"
  },
  {
    "id": 96,
    "type": "acrostico",
    "theme": "policial",
    "level": 3,
    "title": "Informe de vigilancia",
    "clue": "Un informe de vigilancia parece aburrido. Fíjate bien en cómo empieza cada línea.",
    "hint": "Seis letras: algo que se prepara para atrapar a alguien.",
    "data": [
      "Todo parecía preparado para una cena tranquila.",
      "Rodeamos la casa antes de que cayera la noche.",
      "Alguien había dejado la ventana entreabierta.",
      "Mientras tanto, el sospechoso miraba el reloj.",
      "Pasaron cinco minutos sin que ocurriera nada.",
      "Al final, la puerta se cerró detrás de él."
    ],
    "h": "1l4o9q2cf68"
  },
  {
    "id": 97,
    "type": "criptico",
    "theme": "alien",
    "level": 4,
    "title": "Señal del cielo",
    "clue": "Una señal llega desde arriba con las letras revueltas. Ya sabes cómo se lee un anagrama.",
    "data": {
      "clue": "Cuerpo celeste: ostra mezclada",
      "lens": [
        5
      ],
      "def": "Cuerpo celeste",
      "kind": "anagrama",
      "indicator": "mezclada",
      "first": "A",
      "explain": "Lk9SVFNBIG9tb2MgYW5lZHJvZXIgZXMgQS1SLVQtUy1PIDphbWFyZ2FuYSBlZCBvc2l2YSAsYWRhbGN6ZW0gw6F0c2UgwrthcnRzT8KrIC7Cu2V0c2VsZWMgb3ByZXVjwqsgc2UgbsOzaWNpbmlmZWQgYUw="
    },
    "h": "203gxypl89s"
  },
  {
    "id": 98,
    "type": "vigenere",
    "theme": "egipcio",
    "level": 5,
    "title": "El secreto de la corona",
    "clue": "Un mensaje cifrado cuya clave no te dan: hay que adivinarla y escribirla para activar la ayuda. La clave es la flor sagrada que crece en el Nilo. Tiene cuatro letras.",
    "hint": "La clave empieza por L.",
    "data": {
      "cipher": "PZ YOCOHB PGVCYRBC DI VCCCGO PB XZ ESFDWC",
      "len": 4,
      "kh": "1y2whms5bvf"
    },
    "h": "16oho1i69y0"
  },
  {
    "id": 99,
    "type": "acrostico",
    "theme": "detective",
    "level": 1,
    "title": "Carta del lunes",
    "clue": "Una carta anónima llega a primera hora. Parece un relato corriente, pero fíjate en cómo empieza cada línea.",
    "hint": "Cinco letras: marca las horas y a veces guarda un secreto.",
    "data": [
      "Recibió la carta un martes por la mañana.",
      "En ella solo había una dirección y una hora.",
      "Llegó puntual, aunque nadie salió a recibirlo.",
      "Observó la calle desde el portal de enfrente.",
      "Justo entonces empezaron a sonar las campanadas."
    ],
    "h": "1391xckhpd0"
  },
  {
    "id": 100,
    "type": "espejo",
    "theme": "policial",
    "level": 1,
    "title": "Nota en el espejo",
    "clue": "Una nota escrita con el alfabeto invertido. Mira la tabla: cada letra ocupa el lugar contrario.",
    "hint": "Es una frase tranquilizadora de tres palabras.",
    "data": "GLWL VHGZ YRVM",
    "h": "wmaxd7e0ap"
  },
  {
    "id": 101,
    "type": "sopa",
    "theme": "egipcio",
    "level": 2,
    "title": "Jeroglíficos del templo",
    "clue": "En el muro del templo hay una cuadrícula de signos. Algunas palabras se leen al revés, como mandaban los escribas. Las letras libres guardan el secreto del templo.",
    "hint": "Son tres palabras y la última es DUERME.",
    "data": {
      "size": 7,
      "grid": [
        "ESCRIBA",
        "ELFOONM",
        "OARLAOU",
        "AOIPNAL",
        "SNDMURE",
        "IOEERAT",
        "SMLTEFO"
      ],
      "words": [
        {
          "w": "ESCRIBA",
          "h": "27he24fi3mr",
          "len": 7
        },
        {
          "w": "AMULETO",
          "h": "1gxvyf37jk0",
          "len": 7
        },
        {
          "w": "FARAON",
          "h": "22tfns1pgea",
          "len": 6
        },
        {
          "w": "TEMPLO",
          "h": "244oo4t3yjt",
          "len": 6
        },
        {
          "w": "OASIS",
          "h": "126c87lqu8r",
          "len": 5
        },
        {
          "w": "NILO",
          "h": "17yapf1433p",
          "len": 4
        },
        {
          "w": "SOL",
          "h": "243tnpnfagk",
          "len": 3
        }
      ],
      "secretLen": 14
    },
    "h": "17fr7l4op2u"
  },
  {
    "id": 102,
    "type": "cerradura",
    "theme": "alien",
    "level": 2,
    "title": "El panel de la nave",
    "clue": "El panel de mandos se desbloquea con tres cifras distintas. El piloto anotó sus intentos antes de salir.",
    "hint": "Una de las cifras es el cero y otra es el cinco.",
    "data": [
      {
        "g": "497",
        "bien": 0,
        "mal": 1
      },
      {
        "g": "481",
        "bien": 0,
        "mal": 0
      },
      {
        "g": "678",
        "bien": 0,
        "mal": 0
      },
      {
        "g": "607",
        "bien": 1,
        "mal": 0
      },
      {
        "g": "548",
        "bien": 0,
        "mal": 1
      }
    ],
    "h": "2d5e19crr1r"
  },
  {
    "id": 103,
    "type": "escitala",
    "theme": "policial",
    "level": 3,
    "title": "Mensaje en el cinturón",
    "clue": "Un confidente te pasa su cinturón de cuero. Por dentro lleva letras escritas en tira: hay que enrollarlo en un tubo del grosor justo.",
    "hint": "Son cinco palabras y la última es ANOCHECER.",
    "data": {
      "cipher": "EAOAEACCLMNRANHECIPTLOER"
    },
    "h": "knp5lksd3z"
  },
  {
    "id": 104,
    "type": "espejo",
    "theme": "alien",
    "level": 4,
    "title": "Mensaje al revés",
    "clue": "La transmisión llega con el alfabeto invertido. Cada letra es la de la posición contraria.",
    "hint": "Son cinco palabras y empieza por LA.",
    "data": "OZ HVMZO ERVMV WV WVMGIL",
    "h": "205yx2ibie8"
  },
  {
    "id": 105,
    "type": "vigenere",
    "theme": "detective",
    "level": 5,
    "title": "La clave que sube",
    "clue": "Un mensaje cifrado cuya clave no te dan: hay que adivinarla y escribirla para activar la ayuda. La clave es lo que sale de una hoguera y sube al cielo. Tiene cuatro letras.",
    "hint": "La clave empieza por H.",
    "data": {
      "cipher": "LF RILAA STJQNV YZ SS MAHHHA",
      "len": 4,
      "kh": "1om4avb7cif"
    },
    "h": "1zncf2ltob6"
  },
  {
    "id": 106,
    "type": "anagrama",
    "theme": "detective",
    "level": 1,
    "title": "Prueba revuelta",
    "clue": "Las letras de una palabra del inventario quedaron mezcladas.",
    "hint": "Se ponen en las manos para no dejar marcas.",
    "data": {
      "pool": "AUNTGES",
      "lens": [
        7
      ]
    },
    "h": "z2awik81u7"
  },
  {
    "id": 107,
    "type": "acrostico",
    "theme": "policial",
    "level": 1,
    "title": "Informe del agente",
    "clue": "El informe de un agente parece rutinario, pero fíjate en cómo está escrito.",
    "hint": "Cinco letras: es lo que sigue un detective.",
    "data": [
      "Pasaron tres horas desde el robo.",
      "Inspeccionamos cada calle del barrio.",
      "Sobre la mesa había una taza fría.",
      "Todos los testigos dijeron lo mismo.",
      "Aun así, algo no encajaba."
    ],
    "h": "2jwn4quyjw"
  },
  {
    "id": 108,
    "type": "morse",
    "theme": "egipcio",
    "level": 2,
    "title": "Golpes en el sarcófago",
    "clue": "Dentro de la cámara se oye un golpeteo rítmico. Cortos y largos, con pausas.",
    "hint": "Son tres palabras y la primera es un artículo de dos letras.",
    "data": ".-.. .- / -- --- -- .. .- / .... .- -... .-.. .-",
    "h": "3f7qz57qfz"
  },
  {
    "id": 109,
    "type": "espejo",
    "theme": "policial",
    "level": 2,
    "title": "Nota urgente en el espejo",
    "clue": "Una nota escrita en espejo: el alfabeto está del revés y cada letra ocupa el lugar contrario.",
    "hint": "Son cinco palabras y la última es ARCHIVO.",
    "data": "OZ KIFVYZ WVHZKZIVXRL WVO ZIXSREL",
    "h": "w03zkbnfio"
  },
  {
    "id": 110,
    "type": "interrogatorio",
    "theme": "policial",
    "level": 3,
    "title": "La cámara de seguridad",
    "clue": "Alguien apagó la cámara de seguridad del banco. Cuatro empleados estaban de guardia y cada uno declaró.",
    "hint": "No fue Irene.",
    "data": {
      "suspects": [
        "Julián",
        "Irene",
        "Mateo",
        "Lucía"
      ],
      "statements": [
        {
          "by": "Julián",
          "says": "El culpable es Lucía o Mateo."
        },
        {
          "by": "Irene",
          "says": "Fui yo o fue Julián."
        },
        {
          "by": "Mateo",
          "says": "Lucía no fue."
        },
        {
          "by": "Lucía",
          "says": "Ni yo ni Irene fuimos."
        }
      ],
      "rule": "culpableMiente"
    },
    "h": "v9g9h16kkh"
  },
  {
    "id": 111,
    "type": "criptico",
    "theme": "detective",
    "level": 4,
    "title": "La nota sin remitente",
    "clue": "Llega una nota de una sola línea. Una parte te dice qué buscas; la otra, cómo se forman sus letras.",
    "data": {
      "clue": "Agente secreto: sepia revuelta",
      "lens": [
        5
      ],
      "def": "Agente secreto",
      "kind": "anagrama",
      "indicator": "revuelta",
      "first": "E",
      "explain": "LkHDjVBTRSBlbGFzIGV0IEEtSS1QLUUtUyBzYWxjemVtIGlTIC5hbWFyZ2FuYSBlZCBvc2l2YSBsZSBzZSBldXEgLGF0bGV1dmVyIMOhdHNlIMK7YWlwZXPCqyA6c2FydGVsIGVkIG9nZXVqIGxlIHNlIG90c2VyIGxFIC7Cu290ZXJjZXMgZXRuZWdhwqsgc2UgbsOzaWNpbmlmZWQgYUw="
    },
    "h": "e4z2ezywwj"
  },
  {
    "id": 112,
    "type": "teclado",
    "theme": "policial",
    "level": 5,
    "title": "Declaración por SMS",
    "clue": "El único testigo solo contestó con un mensaje de móvil antiguo. Cada grupo es una letra.",
    "hint": "Son cinco palabras y la última es CULPABLE.",
    "data": "66 2 3 444 33 / 888 444 666 / 7777 2 555 444 777 / 2 555 / 222 88 555 7 2 22 555 33",
    "h": "rfwpm091d5"
  },
  {
    "id": 113,
    "type": "morse",
    "theme": "detective",
    "level": 1,
    "title": "Golpes en la cañería",
    "clue": "A través de las tuberías llegan golpes cortos y largos. Alguien intenta avisarte.",
    "hint": "Son tres palabras y la última es CHOFER.",
    "data": "... .. --. ..- . / .- .-.. / -.-. .... --- ..-. . .-.",
    "h": "3zee8qg9z1"
  },
  {
    "id": 114,
    "type": "teclado",
    "theme": "alien",
    "level": 1,
    "title": "Comunicador de la base",
    "clue": "Un comunicador antiguo de la estación lunar repite una secuencia de teclas. Cada grupo es una letra.",
    "hint": "Son dos palabras y la primera es BASE.",
    "data": "22 2 7777 33 / 555 88 66 2 777",
    "h": "2ekxxg76i8d"
  },
  {
    "id": 115,
    "type": "cerradura",
    "theme": "policial",
    "level": 2,
    "title": "La caja del comisario",
    "clue": "La caja del comisario se abre con tres cifras distintas. Un agente apuntó sus intentos antes de irse.",
    "hint": "La cifra del medio es la mayor.",
    "data": [
      {
        "g": "641",
        "bien": 2,
        "mal": 0
      },
      {
        "g": "741",
        "bien": 1,
        "mal": 0
      },
      {
        "g": "732",
        "bien": 0,
        "mal": 0
      },
      {
        "g": "218",
        "bien": 0,
        "mal": 2
      }
    ],
    "h": "1zzy0kkzwst"
  },
  {
    "id": 116,
    "type": "espejo",
    "theme": "egipcio",
    "level": 2,
    "title": "Papiro en el espejo",
    "clue": "Un papiro escrito en espejo: el alfabeto está del revés y cada letra ocupa el lugar contrario.",
    "hint": "La A se escribe Z y la B se escribe Y.",
    "data": "OZ OOZEV VHGZ WVMGIL",
    "h": "76y4mu001w"
  },
  {
    "id": 117,
    "type": "interrogatorio",
    "theme": "alien",
    "level": 3,
    "title": "Intruso a bordo",
    "clue": "Alguien abrió la compuerta mientras la nave estaba en vuelo. Cuatro tripulantes estaban despiertos y cada uno declaró.",
    "hint": "No fue Zeph.",
    "data": {
      "suspects": [
        "Kira",
        "Tarn",
        "Zeph",
        "Lyra"
      ],
      "statements": [
        {
          "by": "Kira",
          "says": "Fue Tarn o fue Zeph."
        },
        {
          "by": "Tarn",
          "says": "Fue Kira o fue Zeph."
        },
        {
          "by": "Zeph",
          "says": "Ni Lyra ni Kira fueron."
        },
        {
          "by": "Lyra",
          "says": "Fui yo o fue Tarn."
        }
      ],
      "rule": "culpableMiente"
    },
    "h": "1728cuwaxh1"
  },
  {
    "id": 118,
    "type": "criptico",
    "theme": "alien",
    "level": 4,
    "title": "Señal del espacio profundo",
    "clue": "Una palabra llegó desde muy lejos con las letras revueltas. Ordénalas y sabrás qué es.",
    "data": {
      "clue": "Transporte espacial: vena revuelta",
      "lens": [
        4
      ],
      "def": "Transporte espacial",
      "kind": "anagrama",
      "indicator": "revuelta",
      "first": "N",
      "explain": "LkVWQU4gb21vYyBhbmVkcm9lciBlcyBBLU4tRS1WIDphbWFyZ2FuYSBlZCBvc2l2YSAsYXRsZXV2ZXIgw6F0c2UgwrthbmVWwqsgLsK7bGFpY2Fwc2UgZXRyb3BzbmFydMKrIHNlIG7Ds2ljaW5pZmVkIGFM"
    },
    "h": "27mby3x8ntn"
  },
  {
    "id": 119,
    "type": "vigenere",
    "theme": "egipcio",
    "level": 5,
    "title": "La palabra olvidada",
    "clue": "Un mensaje cifrado cuya clave no te dan: hay que adivinarla y escribirla para activar la ayuda. La clave es quien anotaba todo en el antiguo Egipto. Tiene siete letras.",
    "hint": "La clave empieza por E.",
    "data": {
      "cipher": "PS RLMSTE KGTZFTE KG RJSE GGP LVB PEDCSZB QYW PRLJE VWELMSDE",
      "len": 7,
      "kh": "2a61hfxykto"
    },
    "h": "z5tnfhn98q"
  },
  {
    "id": 120,
    "type": "espejo",
    "theme": "egipcio",
    "level": 1,
    "title": "Inscripción en el umbral",
    "clue": "Sobre la entrada del templo hay una inscripción en espejo: el alfabeto está del revés.",
    "hint": "Son tres palabras y empieza por BIEN.",
    "data": "YRVMEVMRWL ZO GVNKOL",
    "h": "szb4fbxr8l"
  },
  {
    "id": 121,
    "type": "morse",
    "theme": "egipcio",
    "level": 1,
    "title": "Golpes en la roca",
    "clue": "Desde el interior de la roca llegan golpes cortos y largos. Alguien quiere salir.",
    "hint": "Son tres palabras y la última es PIEDRA.",
    "data": ".--. ..- . .-. - .- / -.. . / .--. .. . -.. .-. .-",
    "h": "1knecyckhk6"
  },
  {
    "id": 122,
    "type": "cerradura",
    "theme": "alien",
    "level": 2,
    "title": "La puerta de la nave",
    "clue": "La escotilla se abre con tres cifras distintas. El registro de la nave guarda los intentos anteriores.",
    "hint": "La suma de las tres cifras es 17.",
    "data": [
      {
        "g": "075",
        "bien": 0,
        "mal": 1
      },
      {
        "g": "637",
        "bien": 0,
        "mal": 1
      },
      {
        "g": "169",
        "bien": 1,
        "mal": 0
      },
      {
        "g": "513",
        "bien": 0,
        "mal": 2
      }
    ],
    "h": "rivct185zu"
  },
  {
    "id": 123,
    "type": "cesar",
    "theme": "detective",
    "level": 2,
    "title": "Postal sin remitente",
    "clue": "Una postal con letras desplazadas. Quien la escribió movió todas lo mismo, pero no dice cuánto.",
    "hint": "El desplazamiento está entre 4 y 8.",
    "data": "KR PGXJOTKXU RU YGHK ZUJU",
    "h": "1aco1y2csxe"
  },
  {
    "id": 124,
    "type": "acrostico",
    "theme": "policial",
    "level": 3,
    "title": "Declaración del sospechoso",
    "clue": "El sospechoso entrega su declaración por escrito. Suena convincente, pero la forma de escribirla esconde algo.",
    "hint": "Cinco letras: la excusa de quien dice que estaba en otro lugar.",
    "data": [
      "Aquella noche dijo estar en casa.",
      "La vecina juró no haberlo visto salir.",
      "Insistió en que dormía desde las diez.",
      "Buscamos el ticket del autobús nocturno.",
      "Intentó explicar por qué no coincidían las horas."
    ],
    "h": "16agl80toi0"
  },
  {
    "id": 125,
    "type": "criptico",
    "theme": "policial",
    "level": 4,
    "title": "El militar de la guardia",
    "clue": "Esta vez las piezas se pegan una detrás de otra. Cada trozo está descrito con otras palabras.",
    "data": {
      "clue": "Astro rey y cubo de juego forman un militar",
      "lens": [
        7
      ],
      "def": "un militar",
      "kind": "suma",
      "indicator": "forman",
      "first": "S",
      "explain": "Lk9EQURMT1MgPSBPREFEICsgTE9TIDpuYWdlcCBlcyBldXEgZWQgYXNpdmEgwrtuYW1yb2bCqyA7T0RBRCBzZSDCu29nZXVqIGVkIG9idWPCqyB5IExPUyBzZSDCu3llciBvcnRzQcKrIC7Cu3JhdGlsaW0gbnXCqyBzZSBuw7NpY2luaWZlZCBhTA=="
    },
    "h": "18smjb205p5"
  },
  {
    "id": 126,
    "type": "vigenere",
    "theme": "alien",
    "level": 5,
    "title": "Mensaje sin clave",
    "clue": "Un mensaje cifrado cuya clave no te dan: hay que adivinarla y escribirla para activar la ayuda. La clave es el satélite que gira alrededor de la Tierra. Tiene cuatro letras.",
    "hint": "La clave empieza por L.",
    "data": {
      "cipher": "YUQIP MNBP XR DZHQE GCRNP FN SPHNL",
      "len": 4,
      "kh": "1qak74g6c6g"
    },
    "h": "1hqjscfxlrt"
  },
  {
    "id": 127,
    "type": "sopa",
    "theme": "detective",
    "level": 1,
    "title": "Notas del inspector",
    "clue": "El inspector escondió su sospecha entre las letras de esta sopa. Encuentra las palabras de la lista: las letras que no pertenezcan a ninguna forman el mensaje.",
    "hint": "Son dos palabras y la última es MAYORDOMO.",
    "data": {
      "size": 6,
      "grid": [
        "LELMCC",
        "HUELLA",
        "AAPYAR",
        "ORRAVT",
        "DOMMEA",
        "PISTAO"
      ],
      "words": [
        {
          "w": "HUELLA",
          "h": "1llmd9xx3qf",
          "len": 6
        },
        {
          "w": "PISTA",
          "h": "1gcpeiv7oyz",
          "len": 5
        },
        {
          "w": "CLAVE",
          "h": "1ct8fxcelwi",
          "len": 5
        },
        {
          "w": "LUPA",
          "h": "1hxa2q6g418",
          "len": 4
        },
        {
          "w": "CARTA",
          "h": "200vs5jsnb6",
          "len": 5
        },
        {
          "w": "ARMA",
          "h": "1z01chqqln4",
          "len": 4
        }
      ],
      "secretLen": 11
    },
    "h": "1ylu6groy17"
  },
  {
    "id": 128,
    "type": "cesar",
    "theme": "detective",
    "level": 1,
    "title": "El telegrama",
    "clue": "Llega un telegrama sin firma. Quien lo escribió desplazó cada letra del alfabeto. La A se escribe E.",
    "hint": "Gira la rueda hasta que la A de dentro quede bajo la E de fuera.",
    "data": "PE GPEZI IW IP VIPSN",
    "h": "1kwnq1wfk58"
  },
  {
    "id": 129,
    "type": "golpes",
    "theme": "egipcio",
    "level": 2,
    "title": "Golpes en el templo",
    "clue": "Un sacerdote golpea el muro del templo con su cayado. Cada letra son dos números: fila y columna.",
    "hint": "Son siete palabras y la última es LUNA.",
    "data": "31 11 / 35 45 15 42 44 11 / 43 15 / 11 12 42 15 / 13 34 33 / 31 11 / 31 45 33 11",
    "h": "148k7opzmwn"
  },
  {
    "id": 130,
    "type": "interrogatorio",
    "theme": "egipcio",
    "level": 2,
    "title": "El saqueo de la tumba",
    "clue": "La tumba del faraón ha sido saqueada. Tres personas del campamento tuvieron ocasión y cada una declaró.",
    "hint": "No fue Tuya.",
    "data": {
      "suspects": [
        "Nefer",
        "Amón",
        "Tuya"
      ],
      "statements": [
        {
          "by": "Nefer",
          "says": "El culpable es Amón o Tuya."
        },
        {
          "by": "Amón",
          "says": "No fue Tuya."
        },
        {
          "by": "Tuya",
          "says": "Fui yo o fue Nefer."
        }
      ],
      "rule": "culpableMiente"
    },
    "h": "17vk1jd8dgt"
  },
  {
    "id": 131,
    "type": "sopa",
    "theme": "detective",
    "level": 3,
    "title": "El dosier del caso",
    "clue": "En el dosier del caso hay una sopa de letras con las palabras clave. Esta vez no hay lista: solo definiciones. Algunas palabras están al revés o en diagonal. Las letras libres cuentan quién huye.",
    "hint": "Son tres palabras y la última es HUYE.",
    "data": {
      "size": 8,
      "grid": [
        "ADATRAOC",
        "LPAHLBID",
        "MEULRECI",
        "EOELAUIS",
        "DUVRERDF",
        "HRMIAPNR",
        "HAUYLEIA",
        "TESTIGOZ"
      ],
      "words": [
        {
          "h": "3m0oys2zg8",
          "len": 7,
          "c": "Persona que vio lo ocurrido"
        },
        {
          "h": "mvfm3ckf20",
          "len": 8,
          "c": "Prueba de que no estabas allí"
        },
        {
          "h": "1a65hp9gaj3",
          "len": 5,
          "c": "Teléfono que se lleva en el bolsillo"
        },
        {
          "h": "1llmd9xx3qf",
          "len": 6,
          "c": "Marca que deja un dedo"
        },
        {
          "h": "2c8tpmbidfe",
          "len": 7,
          "c": "Se usa para no ser reconocido"
        },
        {
          "h": "115je3wkhe1",
          "len": 7,
          "c": "Señal que apunta al culpable"
        },
        {
          "h": "1y0dgefivzw",
          "len": 6,
          "c": "Lo que demuestra algo ante el juez"
        },
        {
          "h": "1z01chqqln4",
          "len": 4,
          "c": "Pistola o cuchillo del crimen"
        },
        {
          "h": "1hxa2q6g418",
          "len": 4,
          "c": "Cristal para ver mejor los detalles"
        }
      ],
      "secretLen": 14
    },
    "h": "28zxunetscg"
  },
  {
    "id": 132,
    "type": "criptico",
    "theme": "policial",
    "level": 4,
    "title": "Piezas del rompecabezas",
    "clue": "Dos piezas, una detrás de otra. Cada una viene descrita con otras palabras.",
    "data": {
      "clue": "Artículo femenino junto a aparato volador sin piloto: un delincuente",
      "lens": [
        6
      ],
      "def": "un delincuente",
      "kind": "suma",
      "indicator": "junto a",
      "first": "L",
      "explain": "Lk5PUkRBTCA9IE5PUkQgKyBBTCA6bmFnZXAgZXMgZXVxIGVkIGFzaXZhIMK7YSBvdG51asKrIDtOT1JEIHNlIMK7b3RvbGlwIG5pcyByb2RhbG92IG90YXJhcGHCqyB5IEFMIHNlIMK7b25pbmVtZWYgb2x1Y8OtdHJBwqsgLsK7ZXRuZXVjbmlsZWQgbnXCqyBzZSBuw7NpY2luaWZlZCBhTA=="
    },
    "h": "1z1bc3p2xpq"
  },
  {
    "id": 133,
    "type": "anagrama",
    "theme": "detective",
    "level": 5,
    "title": "La nota del despacho",
    "clue": "Todas las letras de una frase se mezclaron en un solo montón. Sin separar las palabras.",
    "hint": "Son tres palabras y empieza por EL.",
    "data": {
      "pool": "YMORENOMAOMETLIDE",
      "lens": [
        2,
        9,
        6
      ]
    },
    "h": "1c0fnb7qf5k"
  },
  {
    "id": 134,
    "type": "simbolos",
    "theme": "detective",
    "level": 1,
    "title": "Símbolos en la libreta",
    "clue": "Una libreta llena de símbolos en lugar de letras. La clave está dibujada en la última página.",
    "hint": "Son cuatro palabras y la última es ESPEJO.",
    "data": "ZVEN GENF RY RFCRWB",
    "h": "14uz67u4itn"
  },
  {
    "id": 135,
    "type": "acrostico",
    "theme": "egipcio",
    "level": 1,
    "title": "Diario de la excavación",
    "clue": "El diario de una excavación cuenta el hallazgo de una tumba. Parece un relato corriente, pero fíjate en cómo empieza cada línea.",
    "hint": "Cinco letras: el cuerpo conservado de un faraón.",
    "data": [
      "Mucho antes de que amaneciera, el equipo ya excavaba.",
      "Once metros bajo la arena apareció una puerta sellada.",
      "Mientras la abrían, nadie se atrevió a hablar.",
      "Intacta, en el centro de la sala, esperaba la tumba.",
      "Al fondo, la luz de una linterna tembló un instante."
    ],
    "h": "zivdxss6ta"
  },
  {
    "id": 136,
    "type": "golpes",
    "theme": "alien",
    "level": 2,
    "title": "Señal bajo el hielo",
    "clue": "Algo golpea desde debajo del hielo, en series contadas. Cada letra son dos números: fila y columna.",
    "hint": "Son siete palabras y la última es DIAS.",
    "data": "15 31 / 35 31 11 33 / 43 15 / 11 13 44 24 51 11 / 15 33 / 44 42 15 43 / 14 24 11 43",
    "h": "1h26yq0eqfa"
  },
  {
    "id": 137,
    "type": "interrogatorio",
    "theme": "alien",
    "level": 2,
    "title": "Sabotaje en la nave",
    "clue": "Alguien ha desconectado el radar de la nave. Hay tres tripulantes a bordo y cada uno hizo una declaración.",
    "hint": "No fue Zeta.",
    "data": {
      "suspects": [
        "Zeta",
        "Orión",
        "Vega"
      ],
      "statements": [
        {
          "by": "Zeta",
          "says": "No fue Orión."
        },
        {
          "by": "Orión",
          "says": "Fui yo o fue Vega."
        },
        {
          "by": "Vega",
          "says": "El culpable es Zeta o Orión."
        }
      ],
      "rule": "culpableMiente"
    },
    "h": "21doe332mvm"
  },
  {
    "id": 138,
    "type": "sopa",
    "theme": "policial",
    "level": 3,
    "title": "Plano del atraco",
    "clue": "La policía halló un plano del atraco en forma de sopa de letras. Las palabras clave solo aparecen como definiciones y pueden estar en cualquier dirección. Las letras libres dicen por dónde huyeron.",
    "hint": "Son tres palabras y la última es NORTE.",
    "data": {
      "size": 8,
      "grid": [
        "OVITIGUF",
        "OCALARMA",
        "CALADRON",
        "AMBLABAN",
        "RASAOTEA",
        "TRLTNTUI",
        "AAIDECAR",
        "NNORRTOE"
      ],
      "words": [
        {
          "h": "1ehd8k9odhx",
          "len": 8,
          "c": "Escapa de la justicia"
        },
        {
          "h": "23jaf5huox7",
          "len": 6,
          "c": "Robo a un banco"
        },
        {
          "h": "ffj2kpigzp",
          "len": 6,
          "c": "Graba lo que ocurre en la calle"
        },
        {
          "h": "r8a79rq32w",
          "len": 6,
          "c": "Se lleva lo que no es suyo"
        },
        {
          "h": "1cvwce9fme0",
          "len": 6,
          "c": "Suena cuando alguien entra sin permiso"
        },
        {
          "h": "1i5bucp6qpi",
          "len": 5,
          "c": "Control de la policía en la carretera"
        },
        {
          "h": "2gnakbnnbcf",
          "len": 5,
          "c": "Donde se guarda el dinero"
        },
        {
          "h": "ergrsl14yu",
          "len": 5,
          "c": "Lo robado"
        },
        {
          "h": "1y3xlvh1mz2",
          "len": 4,
          "c": "Camino de escape"
        }
      ],
      "secretLen": 13
    },
    "h": "14us7xkbfb"
  },
  {
    "id": 139,
    "type": "criptico",
    "theme": "egipcio",
    "level": 4,
    "title": "El río del faraón",
    "clue": "Otra vez letras mezcladas. Busca la palabra que hay que desordenar y la que te dice qué es.",
    "data": {
      "clue": "Serpiente egipcia: barco desordenado",
      "lens": [
        5
      ],
      "def": "Serpiente egipcia",
      "kind": "anagrama",
      "indicator": "desordenado",
      "first": "C",
      "explain": "LkFSQk9DIG9tb2MgYW5lZHJvZXIgZXMgTy1DLVItQS1CIDphbWFyZ2FuYSBlZCBvc2l2YSAsb2RhbmVkcm9zZWQgw6F0c2UgwrtvY3JhQsKrIC7Cu2FpY3BpZ2UgZXRuZWlwcmVzwqsgc2UgbsOzaWNpbmlmZWQgYUw="
    },
    "h": "1upj0ue1rdt"
  },
  {
    "id": 140,
    "type": "vigenere",
    "theme": "egipcio",
    "level": 5,
    "title": "La maldición",
    "clue": "Un mensaje cifrado cuya clave no te dan: hay que adivinarla y escribirla para activar la ayuda. La clave es lo que encontraron dentro del sarcófago. Tiene cinco letras.",
    "hint": "La clave empieza por M.",
    "data": {
      "cipher": "XO YILPWOQOZ GATO MTQKTM O XWS OCPQCUCEWS",
      "len": 5,
      "kh": "ifad221w05"
    },
    "h": "bias4i4lql"
  }
]
