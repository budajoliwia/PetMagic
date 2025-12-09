// users/{uid}
export interface UserDoc{
    email:string;
    createdAt: string;
    role: "user" | "admin";

    dailyLimit:number;
    usedToday: number;
    lastUsageDate: string | null;
}

// jobs/{jobsId}
type JobStatus="queued" | "processing" | "done" | "error";

interface JobDoc {
    userId: string;
    type:"GENERATE_STICKER"; 

    inputImagePath: string;
    style: string;

    status:JobStatus;
    errorCode?: string; 
    errorMessage?:string;

    resultGenerationId?: string;

    createdAt: FirebaseFirestore.Timestamp;
    updatedAt: FirebaseFirestore.Timestamp;
}

//generations/{generationId}
interface GenerationDoc {
    userId: string;
    jobId: string;

    inputImagePath: string;
    outputImagePath:string;

    style:string;
    createdAt: FirebaseFirestore.Timestamp;

    title?: string;
    isFavorite?: boolean;
}

