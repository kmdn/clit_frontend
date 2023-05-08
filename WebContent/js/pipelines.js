const examplePipelineConfigs = [
//	/**
//	 * Basic linker pipeline configuration with CG and ED
//	 * NOT WORKING (no linker can do ED-only)
//	 */
//	{
//		"exampleId" : "md_cg_ed",
//		"displayName" : "MD + CG + ED",
//		"id" : 1,
//		"pipelineConfigType" : "complex",
//		"components" : {
//			"md": [
//				{id: "MD1", value: "Babelfy"}
//			],
//			"cg": [
//				{id: "CG1", value: "WikidataDict"}
//			],
//			"ed": [
//				{id: "ED1", value: "AIDA"}
//			]
//		},
//		"connections": [
//			{source: "MD1", target: "CG1"},
//			{source: "CG1", target: "ED1"}
//			],
//			"startComponents": [
//				"MD1"
//			],
//			"endComponents": [
//				"ED1"
//			]
//	},

	/**
	 * Basic linker pipeline configuration with CG only
	 */
	{
		"exampleId" : "md_cg",
		"displayName" : "MD + CG",
		"id" : 1,
		"pipelineConfigType" : "complex",
		"components" : {
				"md": [
					{id: "MD1", value: "Babelfy"}
				],
				"cg": [
					{id: "CG1", value: "DBpediaLookup"}
				]
		},
		"connections": [
			{source: "MD1", target: "CG1"},
		],
		"startComponents": [
			"MD1"
		],
		"endComponents": [
			"CG1"
		]
	},

	/**
	 * Basic linker pipeline configuration with combined CG_ED
	 */
	{
		"exampleId" : "md_combined_cged",
		"displayName" : "MD + combined CG-ED",
		"id" : 1,
		"pipelineConfigType" : "complex",
		"components" : {
				"md": [
					{id: "MD1", value: "Babelfy"}
				],
				"cg_ed": [
					{id: "CG_ED1", value: "Babelfy"}
				]
		},
		"connections": [
			{source: "MD1", target: "CG_ED1"}
		],
		"startComponents": [
			"MD1"
		],
		"endComponents": [
			"CG_ED1"
		]
	},

	/**
	 * Complex example of a linker pipeline configuration with multiple MDs (with combined CG and ED)
	 */
	{
		"exampleId" : "md_splitted_combined_cged",
		"displayName" : "Multiple MDs",
		"id" : 1,
		"pipelineConfigType" : "complex",
		"components" : {
				"md": [
					{id: "MD1", value: "Babelfy"},
					{id: "MD2", value: "DBpediaSpotlight"},
				],
				"cg_ed": [
					{id: "CG_ED1", value: "Babelfy"}
				],
				"combiner": [
					{id: "CO1", value: "union"}
				],
				"splitter": [
					{id: "SP1", value: "copy"}
				]
		},
		"connections": [
			{source: "SP1", target: "MD1"},
			{source: "SP1", target: "MD2"},
			{source: "MD1", target: "CO1"},
			{source: "MD2", target: "CO1"},
			{source: "CO1", target: "CG_ED1"},
		],
		"startComponents": [
			"SP1"
		],
		"endComponents": [
			"CG_ED1"
		]
	},

//	/**
//	 * Complex example of a linker pipeline configuration (with separated CG and ED)
//	 * NOT WORKING (no linker can do ED-only)
//	 */
//	{
//		"exampleId" : "md_splitted_cg_ed",
//		"displayName" : "Multiple MDs (CG + ED seperated)",
//		"id" : 1,
//		"pipelineConfigType" : "complex",
//		"components" : {
//				"md": [
//					{id: "MD1", value: "Babelfy"},
//					{id: "MD2", value: "DBpediaSpotlight"},
//					{id: "MD3", value: "AIDA"}
//				],
//				"cg": [
//					{id: "CG1", value: "Babelfy"}
//				],
//				"ed": [
//					{id: "ED1", value: "Babelfy"}
//				],
//				"combiner": [
//					{id: "CO1", value: "union"}
//				],
//				"splitter": [
//					{id: "SP1", value: "copy"}
//				]
//		},
//		"connections": [
//			{source: "SP1", target: "MD1"},
//			{source: "SP1", target: "MD2"},
//			{source: "SP1", target: "MD3"},
//			{source: "MD1", target: "CO1"},
//			{source: "MD2", target: "CO1"},
//			{source: "MD3", target: "CO1"},
//			{source: "CO1", target: "CG1"},
//			{source: "CG1", target: "ED1"}
//		],
//		"startComponents": [
//			"SP1"
//		],
//		"endComponents": [
//			"ED1"
//		]
//	},

	/**
	 * Complex example of a linker pipeline configuration with multiple CG-EDs (with combined CG and ED)
	 */
	{
		"exampleId" : "md_combined_cged_splitted",
		"displayName" : "Multiple CG-EDs",
	    "id": 1,
	    "pipelineConfigType": "complex",
	    "components": {
	        "md": [
	            {"id": "MD1", "value": "Babelfy"}
	        ],
	        "cg_ed": [
	            {"id": "CG_ED1", "value": "Babelfy"},
	            {"id": "CG_ED2", "value": "DBpediaSpotlight"}
	        ],
	        "combiner": [
		        {"id": "CO1", "value": "union"}
	        ],
	        "splitter": [
	        	{"id": "SP1", "value": "copy"}
	        ]
	    },
	    "connections": [
	        {"source": "MD1", "target": "SP1"},
	        {"source": "SP1", "target": "CG_ED1"},
	        {"source": "SP1", "target": "CG_ED2"},
	        {"source": "CG_ED1","target": "CO1"},
	        {"source": "CG_ED2", "target": "CO1"}
	    ],
	    "startComponents": [
	        "MD1"
	    ],
	    "endComponents": [
	        "CO1"
	    ]
	},

	/**
	 * Basic linker pipeline configuration with translator
	 */
	{
		"exampleId" : "translator",
		"displayName" : "Translator",
		"id" : 1,
		"pipelineConfigType" : "complex",
		"components" : {
				"md": [
					{id: "MD1", value: "Babelfy"}
				],
				"cg_ed": [
					{id: "CG_ED1", value: "DBpediaSpotlight"}
				],
				"translator": [
					{id: "TR1", value: "DBP2WD"}
				]
		},
		"connections": [
			{source: "MD1", target: "CG_ED1"},
			{source: "CG_ED1", target: "TR1"}
		],
		"startComponents": [
			"MD1"
		],
		"endComponents": [
			"TR1"
		]
	},

	/**
	 * Complex example of a linker pipeline configuration with intermediate results, i.e. multiple components linked to
	 * the output
	 */
	{
		"exampleId" : "intermediate_results",
		"displayName" : "Intermediate results",
	    "id": 1,
	    "pipelineConfigType": "complex",
	    "components": {
	        "md": [
	        	{"id": "MD1", "value": "Babelfy"}
	        ],
	        "cg": [
	        	{"id": "CG1", "value": "DBpediaLookup"}
	        ],
	        "cg_ed": [
	            {"id": "CG_ED1", "value": "Babelfy"},
	            {"id": "CG_ED2", "value": "DBpediaSpotlight"}
	        ],
	        "combiner": [
		        {"id": "CO1", "value": "union"}
	        ],
	        "splitter": [
	        	{"id": "SP1", "value": "copy"}
	        ]
	    },
	    "connections": [
	        {"source": "MD1", "target": "SP1"},
	        {"source": "SP1", "target": "CG_ED1"},
	        {"source": "SP1", "target": "CG_ED2"},
	        {"source": "SP1", "target": "CG1"},
	        {"source": "CG_ED1","target": "CO1"},
	        {"source": "CG_ED2", "target": "CO1"}
	    ],
	    "startComponents": [
	        "MD1"
	    ],
	    "endComponents": [
	    	"MD1",
	    	"CG1",
	    	"CG_ED2",
	        "CO1"
	    ]
	},
];
