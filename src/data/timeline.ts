// Timeline data configuration file
// Used to manage data for the timeline page

export interface TimelineItem {
	id: string;
	title: string;
	description: string;
	type: "education" | "work" | "project" | "achievement";
	startDate: string;
	endDate?: string; // If empty, it means current
	location?: string;
	organization?: string;
	position?: string;
	skills?: string[];
	achievements?: string[];
	links?: {
		name: string;
		url: string;
		type: "website" | "certificate" | "project" | "other";
	}[];
	icon?: string; // Iconify icon name
	color?: string;
	featured?: boolean;
}

export const timelineData: TimelineItem[] = [
	{
		id: "ranse-established",
		title: "燃色国风漫研社成立!",
		description: "燃色国风漫研社现如今的动漫社，更名于2024年",
		type: "education",
		startDate: "2024-07-028",
		location: "河科大",
		organization: "燃色国风漫研社",
		skills: ["动漫社", "绘画", "后期", "COS", "摄影", "..."],
		// achievements: [
		// 	"Current GPA: 3.6/4.0",
		// 	"Completed data structures and algorithms course project",
		// 	"Participated in multiple course project developments",
		// ],
		icon: "mdi:animation",
		color: "#52d2d2",
		featured: false,
	},
	{
		id: "tbc-established",
		title: "TBC燃色动漫社成立!",
		description:
			"TBC燃色动漫社是燃色国风漫研社的前身，SCO动漫社的后身，更名于2021年",
		type: "education",
		startDate: "2021-07-028",
		location: "河科大",
		organization: "TBC燃色动漫社",
		skills: ["动漫社", "绘画", "后期", "COS", "摄影", "..."],
		// achievements: [
		// 	"Current GPA: 3.6/4.0",
		// 	"Completed data structures and algorithms course project",
		// 	"Participated in multiple course project developments",
		// ],
		icon: "mdi:animation",
		color: "#c129d8",
		featured: false,
	},
	{
		id: "sco-established",
		title: "SCO动漫社成立!",
		description: "SCO动漫社是燃色国风漫研社的前身，成立于2017年7月",
		type: "education",
		startDate: "2017-07-028",
		location: "河科大",
		organization: "SCO动漫社",
		skills: ["动漫社", "绘画", "后期", "COS", "摄影", "..."],
		// achievements: [
		// 	"Current GPA: 3.6/4.0",
		// 	"Completed data structures and algorithms course project",
		// 	"Participated in multiple course project developments",
		// ],
		icon: "mdi:animation",
		color: "#059669",
		featured: false,
	},
];

// Get timeline statistics
export const getTimelineStats = () => {
	const total = timelineData.length;
	const byType = {
		education: timelineData.filter((item) => item.type === "education")
			.length,
		work: timelineData.filter((item) => item.type === "work").length,
		project: timelineData.filter((item) => item.type === "project").length,
		achievement: timelineData.filter((item) => item.type === "achievement")
			.length,
	};

	return { total, byType };
};

// Get timeline items by type
export const getTimelineByType = (type?: string) => {
	if (!type || type === "all") {
		return timelineData.sort(
			(a, b) =>
				new Date(b.startDate).getTime() -
				new Date(a.startDate).getTime(),
		);
	}
	return timelineData
		.filter((item) => item.type === type)
		.sort(
			(a, b) =>
				new Date(b.startDate).getTime() -
				new Date(a.startDate).getTime(),
		);
};

// Get featured timeline items
export const getFeaturedTimeline = () => {
	return timelineData
		.filter((item) => item.featured)
		.sort(
			(a, b) =>
				new Date(b.startDate).getTime() -
				new Date(a.startDate).getTime(),
		);
};

// Get current ongoing items
export const getCurrentItems = () => {
	return timelineData.filter((item) => !item.endDate);
};

// Calculate total work experience
export const getTotalWorkExperience = () => {
	const workItems = timelineData.filter((item) => item.type === "work");
	let totalMonths = 0;

	workItems.forEach((item) => {
		const startDate = new Date(item.startDate);
		const endDate = item.endDate ? new Date(item.endDate) : new Date();
		const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
		const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
		totalMonths += diffMonths;
	});

	return {
		years: Math.floor(totalMonths / 12),
		months: totalMonths % 12,
	};
};
