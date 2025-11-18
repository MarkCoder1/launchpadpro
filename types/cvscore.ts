// Types for the CV Score Checker feature

export type CVInputType = 'pdf' | 'docx' | 'text'

export interface CVScoreWeights {
	keywordMatch: number // 0-100 weight percentage for category contribution
	structureFormatting: number
	grammarClarity: number
	experienceRelevance: number
	designLayout: number
}

export interface SectionPresence {
	experience: boolean
	education: boolean
	skills: boolean
	projects: boolean
	achievements?: boolean
	certifications?: boolean
	contact?: boolean
}

export interface KeywordAnalysis {
	extractedKeywords: string[]
	present: string[]
	missing: string[]
	coveragePercent: number // 0-100
}

export interface ReadabilityMetrics {
	fleschKincaidGrade: number | null
	colemanLiauIndex: number | null
	readingEase: number | null // Flesch reading ease 0-100 (higher is easier)
	avgSentenceLength: number | null
	complexSentenceRatio: number | null
}

export interface CategoryScoreDetail {
	score: number // 0-100
	reasons: string[]
	suggestions: string[]
}

export interface GrammarIssue {
	type: 'spelling' | 'grammar' | 'clarity' | 'style'
	message: string
	example?: string
	suggestion?: string
}

export interface DesignSignals {
	fontVariety: number // estimated number of distinct font styles detected
	bulletUsage: number // count of bullet-like markers
	hasConsistentHeaders: boolean
	excessiveWhitespace: boolean
	alignmentSignals: 'good' | 'mixed' | 'poor'
}

export interface CVRecommendations {
	// Short, actionable items a candidate can do quickly (<= 6)
	quickWins: string[]
	// Keywords/skills from the JD to explicitly add or emphasize
	addKeywords: string[]
	// Sections that would help strengthen the CV (e.g., Projects, Achievements)
	addSections: string[]
	// Ready-to-copy example bullets tailored to the JD (concise)
	bulletExamples: string[]
}

// Optional low-level PDF-derived line features to aid AI analysis of structure/design
export interface LineFeature {
	page: number
	x: number
	y: number
	text: string
	width: number
	fontSize: number
	indent: number
	isUpper: boolean
	bullet: boolean
}

export interface CVScoreReport {
	total: number // 0-100
	weights: CVScoreWeights
	inputType: CVInputType
	fileName?: string
	extractedText: string
	sections: SectionPresence
	keywords: KeywordAnalysis
	readability: ReadabilityMetrics
	design: DesignSignals
	recommendations: CVRecommendations
	categories: {
		keywordMatch: CategoryScoreDetail
		structureFormatting: CategoryScoreDetail
		grammarClarity: CategoryScoreDetail & { issues?: GrammarIssue[] }
		experienceRelevance: CategoryScoreDetail
		designLayout: CategoryScoreDetail
	}
	meta: {
		createdAt: string
		aiProviders?: {
			grammar?: 'openai' | 'groq' | 'huggingface' | 'none'
			vision?: 'openai' | 'groq' | 'none'
		}
		processingMs?: number
		debug?: {
			extractedTextSample?: string
			lineFeaturesSample?: LineFeature[]
			tokensSample?: string[]
			aiResponseRaw?: string
			imageCount?: number
			modelsTried?: string[]
		}
	}
}

export type CVScoreApiResponse =
	| { ok: true; report: CVScoreReport }
	| { ok: false; error: string }

export interface CVScoreApiOptions {
	useVision?: boolean
	debug?: boolean
}

